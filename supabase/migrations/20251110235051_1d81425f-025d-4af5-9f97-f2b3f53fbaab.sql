-- SECURITY FIX: Implement proper role-based access control
-- Step 1: Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Step 2: Create user_roles table with proper constraints
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, role)
);

-- Step 3: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy for user_roles (users can view their own roles)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Migrate existing admin data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.profiles
WHERE is_admin = true;

-- Step 6: Insert 'user' role for all existing users who aren't admins
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::public.app_role
FROM public.profiles
WHERE is_admin = false OR is_admin IS NULL;

-- Step 7: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 8: Drop old products policy FIRST (before dropping is_admin column)
DROP POLICY IF EXISTS "Allow full access for admins" ON public.products;

-- Step 9: Create new products policy using has_role function
CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 10: Now safe to drop is_admin column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- Step 11: Fix shipments table RLS - restrict to order owners only
DROP POLICY IF EXISTS "Allow public read access to shipments" ON public.shipments;

CREATE POLICY "Users can view their own shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = shipments.order_id::text
    AND orders.user_id = auth.uid()
  )
);

-- Step 12: Fix favorites table - remove blanket policy
DROP POLICY IF EXISTS "Anyone can manage favorites" ON public.favorites;
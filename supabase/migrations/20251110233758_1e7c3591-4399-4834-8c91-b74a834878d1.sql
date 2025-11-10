-- Fix security warning: Set search_path for database functions
-- This prevents SQL injection attacks through search_path manipulation

-- Update update_updated_at_column function to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function - already has SECURITY DEFINER with search_path set
-- Keeping it as is since it already has SET search_path TO ''

-- Update ensure_single_default_address function to set search_path
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- If setting an address as default
  IF NEW.is_default = true THEN
    -- Set all other addresses for this user to not default
    UPDATE public.user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;
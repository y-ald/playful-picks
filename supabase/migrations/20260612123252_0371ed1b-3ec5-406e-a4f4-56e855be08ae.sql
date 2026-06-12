
DROP POLICY IF EXISTS "Users can view their own messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.validate_contact_message()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.name := btrim(NEW.name);
  NEW.email := btrim(NEW.email);
  NEW.message := btrim(NEW.message);
  IF NEW.name IS NULL OR length(NEW.name) = 0 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 1 and 100 characters';
  END IF;
  IF NEW.email IS NULL OR length(NEW.email) > 255
     OR NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;
  IF NEW.message IS NULL OR length(NEW.message) = 0 OR length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 2000 characters';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS validate_contact_message_trg ON public.contact_messages;
CREATE TRIGGER validate_contact_message_trg
BEFORE INSERT OR UPDATE ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_contact_message();

DROP POLICY IF EXISTS "Admins manage user roles" ON public.user_roles;
CREATE POLICY "Admins manage user roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Authenticated users manage own cart items" ON public.cart_items;
CREATE POLICY "Authenticated users manage own cart items"
ON public.cart_items FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Authenticated view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Authenticated insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Authenticated delete own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Anon view favorites by client header" ON public.favorites;
DROP POLICY IF EXISTS "Anon insert favorites by client header" ON public.favorites;
DROP POLICY IF EXISTS "Anon delete favorites by client header" ON public.favorites;

CREATE POLICY "Authenticated view own favorites" ON public.favorites
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated insert own favorites" ON public.favorites
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated delete own favorites" ON public.favorites
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anon view favorites by client header" ON public.favorites
FOR SELECT TO anon USING (
  user_id IS NULL AND client_id IS NOT NULL
  AND client_id = nullif(current_setting('request.headers', true)::json ->> 'x-client-id', '')
);
CREATE POLICY "Anon insert favorites by client header" ON public.favorites
FOR INSERT TO anon WITH CHECK (
  user_id IS NULL AND client_id IS NOT NULL
  AND client_id = nullif(current_setting('request.headers', true)::json ->> 'x-client-id', '')
);
CREATE POLICY "Anon delete favorites by client header" ON public.favorites
FOR DELETE TO anon USING (
  user_id IS NULL AND client_id IS NOT NULL
  AND client_id = nullif(current_setting('request.headers', true)::json ->> 'x-client-id', '')
);

DROP POLICY IF EXISTS "Authenticated users can insert their own records" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own shipments" ON public.shipments;
CREATE POLICY "Users can view their own shipments"
ON public.shipments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = shipments.order_id::text AND o.user_id = auth.uid()
));

DROP POLICY IF EXISTS "all for products bucket 1ifhysk_0" ON storage.objects;
DROP POLICY IF EXISTS "all for products bucket 1ifhysk_1" ON storage.objects;
DROP POLICY IF EXISTS "all for products bucket 1ifhysk_2" ON storage.objects;
DROP POLICY IF EXISTS "all for products bucket 1ifhysk_3" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admins can upload product images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update product images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete product images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'::app_role));

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_address() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_default_address(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_contact_message() FROM anon, authenticated, PUBLIC;

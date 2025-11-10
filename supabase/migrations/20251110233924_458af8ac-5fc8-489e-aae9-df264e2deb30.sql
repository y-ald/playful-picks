-- Fix remaining function security warning: Set search_path for get_default_address
CREATE OR REPLACE FUNCTION public.get_default_address(user_uuid uuid)
RETURNS SETOF user_addresses
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT * FROM public.user_addresses
  WHERE user_id = user_uuid AND is_default = true
  LIMIT 1;
$function$;
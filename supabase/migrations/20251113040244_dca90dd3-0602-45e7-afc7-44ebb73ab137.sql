-- Create function to safely decrement product stock
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  product_uuid UUID,
  quantity_to_subtract INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the stock quantity, ensuring it doesn't go below 0
  UPDATE public.products
  SET 
    stock_quantity = GREATEST(0, stock_quantity - quantity_to_subtract),
    updated_at = NOW()
  WHERE id = product_uuid;
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with ID % not found', product_uuid;
  END IF;
END;
$$;
-- Add payment tracking fields to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id);

-- Add order_id to cart_items for historical tracking
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES orders(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Add comment for documentation
COMMENT ON COLUMN orders.stripe_payment_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN orders.stripe_checkout_session_id IS 'Stripe Checkout Session ID - used for idempotency';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, paid, failed, refunded';
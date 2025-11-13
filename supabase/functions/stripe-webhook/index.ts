import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret || ""
    );

    console.log("Webhook event type:", event.type);

    // Handle successful checkout
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Processing checkout session:", session.id);

      // Get checkout data from session metadata or client reference
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if order already exists (idempotency)
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .single();

      if (existingOrder) {
        console.log("Order already processed:", existingOrder.id);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
        });
      }

      // Retrieve line items from the session
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 100 }
      );

      // Create order record
      const orderId = `order-${Date.now()}`;
      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        user_id: session.client_reference_id || null,
        total_amount: (session.amount_total || 0) / 100,
        status: "paid",
        payment_status: "paid",
        stripe_payment_id: session.payment_intent as string,
        stripe_checkout_session_id: session.id,
        shipping_address: JSON.stringify(session.shipping_details || {}),
        items: JSON.stringify(lineItems.data),
        created_at: new Date().toISOString(),
      });

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Order created successfully:", orderId);

      // Update product inventory
      for (const item of lineItems.data) {
        // Extract product ID from metadata (need to be set when creating line items)
        const productId = item.price?.product as string;

        if (productId) {
          const { error: inventoryError } = await supabase.rpc(
            "decrement_product_stock",
            {
              product_uuid: productId,
              quantity_to_subtract: item.quantity || 1,
            }
          );

          if (inventoryError) {
            console.error("Error updating inventory:", inventoryError);
            // Don't throw - log and continue
          }
        }
      }

      console.log("Inventory updated successfully");
    }

    // Handle failed payments
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Checkout session expired:", session.id);
      // Optionally update order status to 'expired'
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
});

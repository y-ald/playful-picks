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

      // Get session metadata for shipping and product info
      const metadata = session.metadata || {};
      const cartItems = metadata.cart_items ? JSON.parse(metadata.cart_items) : [];
      const shippingInfo = metadata.shipping_info ? JSON.parse(metadata.shipping_info) : null;

      // Create order record
      const orderId = `order-${Date.now()}`;
      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        user_id: session.client_reference_id || null,
        total_amount: (session.amount_total || 0) / 100,
        status: "processing",
        payment_status: "paid",
        stripe_payment_id: session.payment_intent as string,
        stripe_checkout_session_id: session.id,
        shipping_address: JSON.stringify(session.shipping_details || {}),
        shipping_method: shippingInfo ? `${shippingInfo.provider} - ${shippingInfo.servicelevel_name}` : null,
        items: JSON.stringify(lineItems.data),
        created_at: new Date().toISOString(),
      });

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Order created successfully:", orderId);

      // Update product inventory
      for (const item of cartItems) {
        if (item.product?.id) {
          const { error: inventoryError } = await supabase.rpc(
            "decrement_product_stock",
            {
              product_uuid: item.product.id,
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

      // Create shipping label if shipping info was provided
      if (shippingInfo && session.shipping_details) {
        try {
          console.log("Creating shipping label...");
          
          // Call shipping function to create label
          const { data: labelData, error: labelError } = await supabase.functions.invoke(
            "shipping",
            {
              body: {
                action: "createLabel",
                payload: {
                  rate: shippingInfo.object_id,
                  label_file_type: "PDF",
                  async: false,
                },
              },
            }
          );

          if (labelError) {
            console.error("Error creating shipping label:", labelError);
          } else {
            console.log("Shipping label created:", labelData);

            // Update order with tracking info
            await supabase
              .from("orders")
              .update({
                tracking_number: labelData.tracking_number,
                status: "shipped",
              })
              .eq("id", orderId);

            // Send label email to admin
            const shippingDetails = session.shipping_details;
            const { error: emailError } = await supabase.functions.invoke(
              "send-email",
              {
                body: {
                  to: "hpaulfernand@yahoo.com",
                  subject: `New Order Shipping Label - ${orderId}`,
                  html: `
                    <h1>New Order Received: ${orderId}</h1>
                    <p>Payment confirmed via Stripe. Shipping label has been generated.</p>
                    
                    <h2>Customer Information</h2>
                    <p><strong>Name:</strong> ${shippingDetails.name}</p>
                    <p><strong>Email:</strong> ${session.customer_details?.email || 'N/A'}</p>
                    
                    <h2>Shipping Address</h2>
                    <p>${shippingDetails.address?.line1 || ''}</p>
                    ${shippingDetails.address?.line2 ? `<p>${shippingDetails.address.line2}</p>` : ''}
                    <p>${shippingDetails.address?.city || ''}, ${shippingDetails.address?.state || ''} ${shippingDetails.address?.postal_code || ''}</p>
                    <p>${shippingDetails.address?.country || ''}</p>
                    
                    <h2>Order Items</h2>
                    <ul>
                      ${cartItems.map((item: any) => `
                        <li>${item.product?.name || 'Product'} - Qty: ${item.quantity} - $${((item.product?.price || 0) * item.quantity).toFixed(2)}</li>
                      `).join('')}
                    </ul>
                    
                    <h2>Shipping Information</h2>
                    <p><strong>Carrier:</strong> ${shippingInfo.provider}</p>
                    <p><strong>Service:</strong> ${shippingInfo.servicelevel_name}</p>
                    <p><strong>Tracking Number:</strong> ${labelData.tracking_number}</p>
                    
                    <h2>Shipping Label</h2>
                    <p><a href="${labelData.label_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Label (PDF 4x6)</a></p>
                    
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                      Print this label on 4x6 inch thermal paper or regular paper and attach to package.
                    </p>
                  `,
                },
              }
            );

            if (emailError) {
              console.error("Error sending admin email:", emailError);
            } else {
              console.log("Admin email sent successfully");
            }
          }
        } catch (labelCreationError) {
          console.error("Error in shipping label workflow:", labelCreationError);
          // Don't throw - order is still valid even if label fails
        }
      }
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

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

      // Create order record - use text ID format
      const orderIdText = `order-${Date.now()}`;
      const shippingDetails = session.shipping_details;
      
      const { data: orderData, error: orderError } = await supabase.from("orders").insert({
        id: orderIdText,
        user_id: session.client_reference_id || null,
        total_amount: (session.amount_total || 0) / 100,
        status: "processing",
        payment_status: "paid",
        stripe_payment_id: session.payment_intent as string,
        stripe_checkout_session_id: session.id,
        shipping_address: JSON.stringify(shippingDetails || {}),
        shipping_method: shippingInfo ? `${shippingInfo.provider} - ${shippingInfo.servicelevel_name}` : null,
        items: JSON.stringify(lineItems.data),
        created_at: new Date().toISOString(),
      });

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Order created successfully:", orderIdText);

      // Update product inventory
      for (const item of cartItems) {
        if (item.product_id) {
          const { error: inventoryError } = await supabase.rpc(
            "decrement_product_stock",
            {
              product_uuid: item.product_id,
              quantity_to_subtract: item.quantity || 1,
            }
          );

          if (inventoryError) {
            console.error("Error updating inventory:", inventoryError);
          }
        }
      }

      console.log("Inventory updated successfully");

      // Create shipping label if shipping info was provided
      if (shippingInfo && shippingDetails) {
        try {
          console.log("Creating shipping label with rate:", shippingInfo.object_id);
          
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

            // Prepare address data for shipment record
            const addressFrom = {
              name: "Kaia Kids Store",
              company: "Kaia Kids",
              street1: "123 Store Street",
              city: "Montreal",
              state: "QC",
              zip: "H1A 1A1",
              country: "CA",
              phone: "+1 514 123 4567",
            };
            
            const addressTo = {
              name: shippingDetails.name || "",
              street1: shippingDetails.address?.line1 || "",
              street2: shippingDetails.address?.line2 || "",
              city: shippingDetails.address?.city || "",
              state: shippingDetails.address?.state || "",
              zip: shippingDetails.address?.postal_code || "",
              country: shippingDetails.address?.country || "",
              email: session.customer_details?.email || "",
            };

            // Create shipment record in database
            // Note: order_id expects UUID, so we use a placeholder and store real ID in metadata
            const placeholderUuid = crypto.randomUUID();
            const { data: shipmentData, error: shipmentError } = await supabase
              .from("shipments")
              .insert({
                order_id: placeholderUuid, // Placeholder since order_id is UUID but we use text IDs
                tracking_number: labelData.tracking_number,
                carrier: shippingInfo.provider,
                label_url: labelData.label_url,
                status: labelData.status || "LABEL_CREATED",
                rate_id: shippingInfo.object_id,
                address_from: addressFrom,
                address_to: addressTo,
                metadata: {
                  order_id_text: orderIdText, // Store the actual text order ID
                  service_level: shippingInfo.servicelevel_name,
                  estimated_days: shippingInfo.estimated_days,
                  shipping_cost: shippingInfo.amount,
                  eta: labelData.eta,
                  tracking_url: labelData.tracking_url_provider,
                },
              })
              .select()
              .single();

            if (shipmentError) {
              console.error("Error saving shipment:", shipmentError);
            } else {
              console.log("Shipment saved:", shipmentData);

              // Update order with tracking info
              await supabase
                .from("orders")
                .update({
                  tracking_number: labelData.tracking_number,
                  status: "shipped",
                })
                .eq("id", orderIdText);
            }

            // Send email to admin with shipping label
            const { error: adminEmailError } = await supabase.functions.invoke(
              "send-email",
              {
                body: {
                  to: "hpaulfernand@yahoo.com",
                  subject: `🚚 Nouvelle commande - ${orderIdText}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h1 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
                        Nouvelle Commande: ${orderIdText}
                      </h1>
                      
                      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h2 style="color: #4CAF50; margin-top: 0;">✅ Paiement confirmé via Stripe</h2>
                        <p><strong>Montant:</strong> $${((session.amount_total || 0) / 100).toFixed(2)}</p>
                      </div>
                      
                      <h2 style="color: #333;">📦 Informations Client</h2>
                      <p><strong>Nom:</strong> ${shippingDetails.name}</p>
                      <p><strong>Email:</strong> ${session.customer_details?.email || 'N/A'}</p>
                      
                      <h2 style="color: #333;">🏠 Adresse de livraison</h2>
                      <p>${shippingDetails.address?.line1 || ''}</p>
                      ${shippingDetails.address?.line2 ? `<p>${shippingDetails.address.line2}</p>` : ''}
                      <p>${shippingDetails.address?.city || ''}, ${shippingDetails.address?.state || ''} ${shippingDetails.address?.postal_code || ''}</p>
                      <p>${shippingDetails.address?.country || ''}</p>
                      
                      <h2 style="color: #333;">🛒 Articles commandés</h2>
                      <ul style="list-style: none; padding: 0;">
                        ${cartItems.map((item: any) => `
                          <li style="padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 3px;">
                            <strong>${item.name || 'Product'}</strong> - Qté: ${item.quantity} - $${((item.price || 0) * item.quantity).toFixed(2)}
                          </li>
                        `).join('')}
                      </ul>
                      
                      <h2 style="color: #333;">🚛 Expédition</h2>
                      <p><strong>Transporteur:</strong> ${shippingInfo.provider}</p>
                      <p><strong>Service:</strong> ${shippingInfo.servicelevel_name}</p>
                      <p><strong>Délai estimé:</strong> ${shippingInfo.estimated_days} jours</p>
                      <p><strong>Numéro de suivi:</strong> <code style="background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${labelData.tracking_number}</code></p>
                      
                      <div style="margin-top: 30px; text-align: center;">
                        <a href="${labelData.label_url}" 
                           style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                          📄 Télécharger l'étiquette (PDF 4x6)
                        </a>
                      </div>
                      
                      <p style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
                        Imprimez cette étiquette sur du papier thermique 4x6 pouces ou du papier standard et collez-la sur le colis.
                      </p>
                    </div>
                  `,
                },
              }
            );

            if (adminEmailError) {
              console.error("Error sending admin email:", adminEmailError);
            } else {
              console.log("Admin email sent successfully");
            }

            // Send confirmation email to customer
            const { error: customerEmailError } = await supabase.functions.invoke(
              "send-email",
              {
                body: {
                  to: session.customer_details?.email || "",
                  subject: `📦 Confirmation de commande - ${orderIdText}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h1 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
                        Merci pour votre commande!
                      </h1>
                      
                      <p>Votre commande <strong>${orderIdText}</strong> a été confirmée et est en cours de préparation.</p>
                      
                      <h2 style="color: #333;">📦 Détails de la commande</h2>
                      <ul style="list-style: none; padding: 0;">
                        ${cartItems.map((item: any) => `
                          <li style="padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 3px;">
                            <strong>${item.name || 'Product'}</strong> - Qté: ${item.quantity} - $${((item.price || 0) * item.quantity).toFixed(2)}
                          </li>
                        `).join('')}
                      </ul>
                      
                      <p style="font-size: 18px; font-weight: bold;">Total: $${((session.amount_total || 0) / 100).toFixed(2)}</p>
                      
                      <h2 style="color: #333;">🚛 Informations d'expédition</h2>
                      <p><strong>Transporteur:</strong> ${shippingInfo.provider} - ${shippingInfo.servicelevel_name}</p>
                      <p><strong>Délai estimé:</strong> ${shippingInfo.estimated_days} jours ouvrables</p>
                      <p><strong>Numéro de suivi:</strong> <code style="background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${labelData.tracking_number}</code></p>
                      
                      ${labelData.tracking_url_provider ? `
                        <div style="margin-top: 20px; text-align: center;">
                          <a href="${labelData.tracking_url_provider}" 
                             style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            🔍 Suivre ma commande
                          </a>
                        </div>
                      ` : ''}
                      
                      <h2 style="color: #333;">🏠 Adresse de livraison</h2>
                      <p>${shippingDetails.name}</p>
                      <p>${shippingDetails.address?.line1 || ''}</p>
                      ${shippingDetails.address?.line2 ? `<p>${shippingDetails.address.line2}</p>` : ''}
                      <p>${shippingDetails.address?.city || ''}, ${shippingDetails.address?.state || ''} ${shippingDetails.address?.postal_code || ''}</p>
                      <p>${shippingDetails.address?.country || ''}</p>
                      
                      <p style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
                        Si vous avez des questions, n'hésitez pas à nous contacter.
                      </p>
                    </div>
                  `,
                },
              }
            );

            if (customerEmailError) {
              console.error("Error sending customer email:", customerEmailError);
            } else {
              console.log("Customer email sent successfully");
            }
          }
        } catch (labelCreationError) {
          console.error("Error in shipping label workflow:", labelCreationError);
        }
      }
    }

    // Handle failed payments
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Checkout session expired:", session.id);
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

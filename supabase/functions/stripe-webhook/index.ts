import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const adminEmail = Deno.env.get("ADMIN_EMAIL") || "";

if (!webhookSecret) console.warn("STRIPE_WEBHOOK_SECRET is not set");
if (!adminEmail) console.warn("ADMIN_EMAIL is not set - admin notifications will be skipped");

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
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

      // Retrieve shipping address from payment_intent or metadata
      let shippingDetails: any = null;
      if (session.payment_intent) {
        try {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          shippingDetails = pi.shipping;
        } catch (e) {
          console.warn("Could not retrieve PaymentIntent shipping:", e);
        }
      }
      if (!shippingDetails) {
        shippingDetails = {
          name: metadata.shipping_name || "",
          address: {
            line1: metadata.shipping_address || "",
            city: metadata.shipping_city || "",
            state: metadata.shipping_state || "",
            postal_code: metadata.shipping_zip || "",
            country: metadata.shipping_country || "",
          },
        };
      }
      
      const { data: orderData, error: orderError } = await supabase.from("orders").insert({
        id: orderIdText,
        user_id: session.client_reference_id || null,
        total_amount: (session.amount_total || 0) / 100,
        status: "processing",
        payment_status: "succeeded",
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

      // --- ENSURE USER EXISTS & LINK ORDER ---
      let effectiveUserId = session.client_reference_id || null;

      if (!effectiveUserId && customerEmail) {
        try {
          // Check if a user with this email already exists
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(
            (u: any) => u.email?.toLowerCase() === customerEmail.toLowerCase()
          );

          if (existingUser) {
            effectiveUserId = existingUser.id;
            console.log("Found existing user for email:", customerEmail, effectiveUserId);
          } else {
            // Create a new user with a random password (they can reset via magic link)
            const tempPassword = crypto.randomUUID();
            const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
              email: customerEmail,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                first_name: shippingDetails?.name?.split(" ")[0] || "",
                last_name: shippingDetails?.name?.split(" ").slice(1).join(" ") || "",
              },
            });

            if (createUserError) {
              console.error("Error creating user:", createUserError);
            } else if (newUser?.user) {
              effectiveUserId = newUser.user.id;
              console.log("Created new user:", customerEmail, effectiveUserId);

              // Create profile for the new user
              const nameParts = (shippingDetails?.name || "").split(" ");
              await supabase.from("profiles").upsert({
                id: effectiveUserId,
                first_name: nameParts[0] || null,
                last_name: nameParts.slice(1).join(" ") || null,
                phone_number: metadata.shipping_phone || null,
              });
            }
          }

          // Link the order to the user
          if (effectiveUserId) {
            await supabase
              .from("orders")
              .update({ user_id: effectiveUserId })
              .eq("id", orderIdText);
            console.log("Order linked to user:", effectiveUserId);
          }
        } catch (userError) {
          console.error("Error in user creation/linking:", userError);
        }
      }

      // --- SAVE SHIPPING ADDRESS TO USER_ADDRESSES ---
      if (effectiveUserId && shippingDetails?.address) {
        try {
          const addr = shippingDetails.address;
          const streetAddress = addr.line1 || metadata.shipping_address || "";
          const city = addr.city || metadata.shipping_city || "";
          const state = addr.state || metadata.shipping_state || "";
          const postalCode = addr.postal_code || metadata.shipping_zip || "";
          const country = addr.country || metadata.shipping_country || "";

          if (streetAddress && city) {
            // Check if this exact address already exists for the user
            const { data: existingAddresses } = await supabase
              .from("user_addresses")
              .select("id")
              .eq("user_id", effectiveUserId)
              .eq("street_address", streetAddress)
              .eq("postal_code", postalCode);

            if (!existingAddresses || existingAddresses.length === 0) {
              // Check if user has any addresses (to set is_default)
              const { count } = await supabase
                .from("user_addresses")
                .select("id", { count: "exact", head: true })
                .eq("user_id", effectiveUserId);

              const isFirstAddress = (count || 0) === 0;

              const { error: addrError } = await supabase
                .from("user_addresses")
                .insert({
                  user_id: effectiveUserId,
                  street_address: streetAddress,
                  city,
                  state,
                  postal_code: postalCode,
                  country,
                  is_default: isFirstAddress,
                });

              if (addrError) {
                console.error("Error saving address:", addrError);
              } else {
                console.log("Shipping address saved for user:", effectiveUserId);
              }
            } else {
              console.log("Address already exists, skipping save");
            }
          }
        } catch (addrError) {
          console.error("Error in address saving:", addrError);
        }
      }

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

      // --- STEP 4: Create shipping label (independent from emails) ---
      let labelData: any = null;
      const customerEmail = session.customer_details?.email || metadata.shipping_email || "";
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
        name: shippingDetails?.name || "",
        street1: shippingDetails?.address?.line1 || "",
        street2: shippingDetails?.address?.line2 || "",
        city: shippingDetails?.address?.city || "",
        state: shippingDetails?.address?.state || "",
        zip: shippingDetails?.address?.postal_code || "",
        country: shippingDetails?.address?.country || "",
        email: customerEmail,
      };

      if (shippingInfo?.object_id) {
        try {
          console.log("Creating shipping label with rate:", shippingInfo.object_id);
          
          const { data: rawLabel, error: labelError } = await supabase.functions.invoke(
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
          } else if (rawLabel?.status === "ERROR" || rawLabel?.object_state === "ERROR") {
            console.error("Shippo returned error status:", JSON.stringify(rawLabel));
          } else {
            labelData = rawLabel;
            console.log("Shipping label created successfully:", {
              tracking_number: labelData?.tracking_number,
              label_url: labelData?.label_url,
              status: labelData?.status,
            });

            // Save shipment to DB
            const placeholderUuid = crypto.randomUUID();
            const { error: shipmentError } = await supabase
              .from("shipments")
              .insert({
                order_id: placeholderUuid,
                tracking_number: labelData.tracking_number,
                carrier: shippingInfo.provider,
                label_url: labelData.label_url,
                status: labelData.status || "LABEL_CREATED",
                rate_id: shippingInfo.object_id,
                address_from: addressFrom,
                address_to: addressTo,
                metadata: {
                  order_id_text: orderIdText,
                  service_level: shippingInfo.servicelevel_name,
                  estimated_days: shippingInfo.estimated_days,
                  shipping_cost: shippingInfo.amount,
                  eta: labelData.eta,
                  tracking_url: labelData.tracking_url_provider,
                },
              });

            if (shipmentError) {
              console.error("Error saving shipment to DB:", shipmentError);
            }

            // Update order with tracking
            await supabase
              .from("orders")
              .update({
                tracking_number: labelData.tracking_number,
                status: "shipped",
              })
              .eq("id", orderIdText);
          }
        } catch (labelCreationError) {
          console.error("Error in shipping label workflow:", labelCreationError);
        }
      } else {
        console.warn("No shipping rate object_id found, skipping label creation");
      }

      // --- STEP 5: Send admin email (always, regardless of label success) ---
      if (adminEmail) {
        try {
          const trackingSection = labelData
            ? `
              <h2 style="color: #333;">🚛 Expedition</h2>
              <p><strong>Transporteur:</strong> ${shippingInfo?.provider || 'N/A'}</p>
              <p><strong>Service:</strong> ${shippingInfo?.servicelevel_name || 'N/A'}</p>
              <p><strong>Delai estime:</strong> ${shippingInfo?.estimated_days || '?'} jours</p>
              <p><strong>Numero de suivi:</strong> <code style="background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${labelData.tracking_number}</code></p>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${labelData.label_url}" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Telecharger l'etiquette (PDF 4x6)
                </a>
              </div>
            `
            : `
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffc107;">
                <h2 style="color: #856404; margin-top: 0;">⚠️ Etiquette non creee</h2>
                <p>La creation automatique de l'etiquette a echoue. Creez-la manuellement depuis le dashboard Shippo.</p>
                <p><strong>Transporteur demande:</strong> ${shippingInfo?.provider || 'N/A'} - ${shippingInfo?.servicelevel_name || 'N/A'}</p>
              </div>
            `;

          const { error: adminEmailError } = await supabase.functions.invoke("send-email", {
            body: {
              to: adminEmail,
              subject: `Nouvelle commande - ${orderIdText}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
                    Nouvelle Commande: ${orderIdText}
                  </h1>
                  <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h2 style="color: #4CAF50; margin-top: 0;">Paiement confirme via Stripe</h2>
                    <p><strong>Montant:</strong> $${((session.amount_total || 0) / 100).toFixed(2)}</p>
                    <p><strong>Stripe Session:</strong> ${session.id}</p>
                  </div>
                  <h2 style="color: #333;">Informations Client</h2>
                  <p><strong>Nom:</strong> ${shippingDetails?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> ${customerEmail || 'N/A'}</p>
                  <h2 style="color: #333;">Adresse de livraison</h2>
                  <p>${addressTo.street1}</p>
                  ${addressTo.street2 ? `<p>${addressTo.street2}</p>` : ''}
                  <p>${addressTo.city}, ${addressTo.state} ${addressTo.zip}</p>
                  <p>${addressTo.country}</p>
                  <h2 style="color: #333;">Articles commandes</h2>
                  <ul style="list-style: none; padding: 0;">
                    ${cartItems.map((item: any) => `
                      <li style="padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 3px;">
                        <strong>${item.name || 'Product'}</strong> - Qte: ${item.quantity} - $${((item.price || 0) * item.quantity).toFixed(2)}
                      </li>
                    `).join('')}
                  </ul>
                  ${trackingSection}
                </div>
              `,
            },
          });

          if (adminEmailError) {
            console.error("Error sending admin email:", adminEmailError);
          } else {
            console.log("Admin email sent successfully to:", adminEmail);
          }
        } catch (emailErr) {
          console.error("Admin email exception:", emailErr);
        }
      } else {
        console.warn("ADMIN_EMAIL secret not set, skipping admin notification");
      }

      // --- STEP 6: Send customer confirmation email (always) ---
      if (customerEmail) {
        try {
          const trackingSection = labelData
            ? `
              <h2 style="color: #333;">Informations d'expedition</h2>
              <p><strong>Transporteur:</strong> ${shippingInfo?.provider || ''} - ${shippingInfo?.servicelevel_name || ''}</p>
              <p><strong>Delai estime:</strong> ${shippingInfo?.estimated_days || '?'} jours ouvrables</p>
              <p><strong>Numero de suivi:</strong> <code style="background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${labelData.tracking_number}</code></p>
              ${labelData.tracking_url_provider ? `
                <div style="margin-top: 20px; text-align: center;">
                  <a href="${labelData.tracking_url_provider}" style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Suivre ma commande
                  </a>
                </div>
              ` : ''}
            `
            : `
              <h2 style="color: #333;">Expedition</h2>
              <p>Votre commande est en cours de preparation. Vous recevrez les informations de suivi par email des que le colis sera expedie.</p>
              <p><strong>Transporteur:</strong> ${shippingInfo?.provider || 'N/A'} - ${shippingInfo?.servicelevel_name || 'Standard'}</p>
              <p><strong>Delai estime:</strong> ${shippingInfo?.estimated_days || '5-7'} jours ouvrables</p>
            `;

          const { error: customerEmailError } = await supabase.functions.invoke("send-email", {
            body: {
              to: customerEmail,
              subject: `Confirmation de commande - ${orderIdText}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
                    Merci pour votre commande!
                  </h1>
                  <p>Votre commande <strong>${orderIdText}</strong> a ete confirmee.</p>
                  <h2 style="color: #333;">Details de la commande</h2>
                  <ul style="list-style: none; padding: 0;">
                    ${cartItems.map((item: any) => `
                      <li style="padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 3px;">
                        <strong>${item.name || 'Product'}</strong> - Qte: ${item.quantity} - $${((item.price || 0) * item.quantity).toFixed(2)}
                      </li>
                    `).join('')}
                  </ul>
                  <p style="font-size: 18px; font-weight: bold;">Total: $${((session.amount_total || 0) / 100).toFixed(2)}</p>
                  ${trackingSection}
                  <h2 style="color: #333;">Adresse de livraison</h2>
                  <p>${shippingDetails?.name || ''}</p>
                  <p>${addressTo.street1}</p>
                  ${addressTo.street2 ? `<p>${addressTo.street2}</p>` : ''}
                  <p>${addressTo.city}, ${addressTo.state} ${addressTo.zip}</p>
                  <p>${addressTo.country}</p>
                  <p style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
                    Si vous avez des questions, n'hesitez pas a nous contacter.
                  </p>
                </div>
              `,
            },
          });

          if (customerEmailError) {
            console.error("Error sending customer email:", customerEmailError);
          } else {
            console.log("Customer email sent successfully to:", customerEmail);
          }
        } catch (emailErr) {
          console.error("Customer email exception:", emailErr);
        }
      } else {
        console.warn("No customer email found, skipping customer notification");
      }

      console.log(`=== Order ${orderIdText} processing complete ===`);
      console.log(`  Label: ${labelData ? 'OK' : 'FAILED'}`);
      console.log(`  Admin email: ${adminEmail || 'NOT SET'}`);
      console.log(`  Customer email: ${customerEmail || 'NOT SET'}`);
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cartItems, shippingAddress, shippingRate, language, userId } =
      await req.json();
    console.log("Received checkout request:", {
      cartItems,
      shippingAddress,
      shippingRate,
      language,
      userId,
    });

    // Default to English if no language is provided
    const userLanguage = language || "en";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create line items from cart items
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.name,
          images: item.product.image_url ? [item.product.image_url] : [],
          metadata: {
            product_id: item.product.id, // Store product ID for inventory update
          },
        },
        unit_amount: Math.round(item.product.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    console.log("Creating Stripe session with line items:", lineItems);

    // Prepare metadata for webhook processing
    const metadata = {
      cart_items: JSON.stringify(cartItems),
      shipping_rate: JSON.stringify(shippingRate),
      language: userLanguage,
    };

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get(
        "origin"
      )}/${userLanguage}/checkout/success`,
      cancel_url: `${req.headers.get("origin")}/${userLanguage}/cart`,
      customer_email: shippingAddress.email,
      client_reference_id: userId || null, // Track user for order creation
      metadata, // Pass data to webhook
      shipping_address_collection: {
        allowed_countries: ["US", "CA"], // Adjust based on your shipping regions
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(shippingRate.amount * 100), // Convert to cents
              currency: "usd",
            },
            display_name: `${shippingRate.provider} - ${shippingRate.servicelevel?.name || 'Standard'}`,
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: shippingRate.estimated_days || 3,
              },
              maximum: {
                unit: "business_day",
                value: (shippingRate.estimated_days || 3) + 2,
              },
            },
          },
        },
      ],
    });

    console.log("Created Stripe session:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

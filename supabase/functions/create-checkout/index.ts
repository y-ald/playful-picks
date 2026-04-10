import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const userLanguage = language || "en";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Validate prices server-side by fetching from the database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Cart is empty or invalid");
    }

    const productIds = cartItems.map((item: any) => {
      const pid = item.product_id || item.product?.id;
      if (!pid) {
        console.error("Cart item missing product ID:", JSON.stringify(item));
        throw new Error("Cart item missing product ID");
      }
      return pid;
    });

    console.log("Validating product IDs:", productIds);

    const { data: verifiedProducts, error: dbError } = await supabase
      .from("products")
      .select("id, name, price, image_url, stock_quantity")
      .in("id", productIds);

    if (dbError || !verifiedProducts) {
      console.error("DB error verifying products:", dbError);
      throw new Error("Failed to verify product prices");
    }

    console.log(`Verified ${verifiedProducts.length} products from DB`);

    const productMap = new Map(verifiedProducts.map((p: any) => [p.id, p]));

    const lineItems = cartItems.map((item: any) => {
      const itemProductId = item.product_id || item.product?.id;
      const verified = productMap.get(itemProductId);
      if (!verified) {
        throw new Error(`Product not found in DB: ${itemProductId}`);
      }
      if (verified.stock_quantity !== null && verified.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${verified.name}`);
      }
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: verified.name,
            images: verified.image_url ? [verified.image_url] : [],
            metadata: { product_id: verified.id },
          },
          unit_amount: Math.round(verified.price * 100),
        },
        quantity: item.quantity,
      };
    });

    console.log("Line items built successfully:", lineItems.length);

    const essentialCartItems = cartItems.map((item: any) => {
      const itemProductId = item.product_id || item.product?.id;
      const verified = productMap.get(itemProductId);
      return {
        product_id: itemProductId,
        name: verified?.name || item.product?.name || "Unknown",
        price: verified?.price || item.product?.price || 0,
        quantity: item.quantity,
      };
    });
    
    const essentialShippingInfo = {
      object_id: shippingRate.object_id,
      provider: shippingRate.provider,
      servicelevel_name: shippingRate.servicelevel?.name || 'Standard',
      amount: shippingRate.amount,
      estimated_days: shippingRate.estimated_days,
    };
    
    const metadata = {
      cart_items: JSON.stringify(essentialCartItems),
      shipping_info: JSON.stringify(essentialShippingInfo),
      language: userLanguage,
    };

    // Prepare session options with prefilled shipping address
    const sessionOptions: any = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get(
        "origin"
      )}/${userLanguage}/checkout/success`,
      cancel_url: `${req.headers.get("origin")}/${userLanguage}/cart`,
      customer_email: shippingAddress.email,
      metadata: {
        ...metadata,
        shipping_name: shippingAddress.name,
        shipping_address: shippingAddress.address,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_zip: shippingAddress.zipCode,
        shipping_country: shippingAddress.country,
      },
      payment_intent_data: {
        shipping: {
          name: shippingAddress.name,
          address: {
            line1: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.zipCode,
            country: shippingAddress.country,
          },
        },
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
    };

    // Only add client_reference_id if userId exists and is not empty
    if (userId && userId.trim() !== "") {
      sessionOptions.client_reference_id = userId;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);

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

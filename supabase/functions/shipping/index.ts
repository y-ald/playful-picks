import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createShipment, getRates, createLabel, trackShipment } from "./api.ts";
import { corsHeaders } from "./cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    switch (action) {
      case "createShipment":
        const shipment = await createShipment(payload);

        // Store shipment data in database for tracking
        const supabaseClient =
          Deno.env.get("SUPABASE_URL") && Deno.env.get("SUPABASE_ANON_KEY")
            ? createClient(
                Deno.env.get("SUPABASE_URL") || "",
                Deno.env.get("SUPABASE_ANON_KEY") || ""
              )
            : null;

        if (supabaseClient) {
          await supabaseClient.from("shipments").insert({
            shipment_id: shipment.object_id,
            user_id: payload.user_id,
            order_id: payload.order_id,
            tracking_number: shipment.tracking_number,
            carrier: shipment.carrier,
            status: shipment.status,
            created_at: new Date().toISOString(),
            metadata: payload.metadata || {},
          });
        }

        return new Response(JSON.stringify(shipment), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case "getRates":
        console.log("payload", payload);
        const rates = await getRates(payload);
        return new Response(JSON.stringify(rates), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case "createLabel":
        console.log("payload", payload);
        const label = await createLabel(payload);

        return new Response(JSON.stringify(label), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "SHIPPO-API-VERSION": "2018-02-08",
          },
        });

      case "trackShipment":
        console.log("payload", payload);
        const tracking = await trackShipment(payload);
        return new Response(JSON.stringify(tracking), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Shipping API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

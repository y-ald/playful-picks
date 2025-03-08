import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateAddress, getRates, createLabel, trackShipment } from "./api.ts"
import { corsHeaders } from "./cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()

    switch (action) {
      case 'validateAddress':
        const validation = await validateAddress(payload)
        return new Response(JSON.stringify(validation), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'getRates':
        const rates = await getRates(payload)
        return new Response(JSON.stringify(rates), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'createLabel':
        const label = await createLabel(payload)
        return new Response(JSON.stringify(label), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'trackShipment':
        const tracking = await trackShipment(payload)
        return new Response(JSON.stringify(tracking), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Shipping API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

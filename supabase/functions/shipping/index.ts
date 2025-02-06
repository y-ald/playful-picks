
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Shippo from "https://esm.sh/shippo@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const shippo = new Shippo(Deno.env.get('SHIPPO_API_KEY'))
    const { action, payload } = await req.json()

    switch (action) {
      case 'validateAddress':
        const address = await shippo.address.create(payload)
        const validation = await shippo.address.validate(address.object_id)
        return new Response(JSON.stringify(validation), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'getRates':
        const { fromAddress, toAddress, parcel } = payload
        const shipment = await shippo.shipment.create({
          address_from: fromAddress,
          address_to: toAddress,
          parcels: [parcel],
          async: false
        })
        return new Response(JSON.stringify(shipment.rates), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'createLabel':
        const { rateId } = payload
        const transaction = await shippo.transaction.create({
          rate: rateId,
          async: false
        })
        return new Response(JSON.stringify(transaction), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'trackShipment':
        const { carrier, trackingNumber } = payload
        const tracking = await shippo.track.get(carrier, trackingNumber)
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

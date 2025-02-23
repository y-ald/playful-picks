import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Shippo from "https://esm.sh/shippo@2.0.0"
import { corsHeaders } from './config.ts'
import { ShippingRequest, ShippingResponse, ErrorResponse } from './types.ts'

// Load environment variables
const env = Deno.env.toObject();
const shippoApiKey = env.SHIPPO_API_KEY || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, payload }: ShippingRequest = await req.json()

    if (!shippoApiKey) {
      throw new Error('Shippo API key is not set');
    }

    const shippo = new Shippo(shippoApiKey)

    let response: ShippingResponse;

    switch (action) {
      case 'validateAddress':
        const address = await shippo.address.create(payload)
        response = await shippo.address.validate(address.object_id)
        break;

      case 'getRates':
        const { fromAddress, toAddress, parcel } = payload
        const shipment = await shippo.shipment.create({
          address_from: fromAddress,
          address_to: toAddress,
          parcels: [parcel],
          async: false
        })
        response = shipment.rates
        break;

      case 'createLabel':
        const { rateId } = payload
        response = await shippo.transaction.create({
          rate: rateId,
          async: false
        })
        break;

      case 'trackShipment':
        const { carrier, trackingNumber } = payload
        response = await shippo.track.get(carrier, trackingNumber)
        break;

      case 'getAddressSuggestions':
        const { street1, city, state, zip, country } = payload
        const suggestions = await shippo.address.suggest({
          street1,
          city,
          state,
          zip_code: zip,
          country,
        })
        response = suggestions
        break;

      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Shipping API Error:', error)
    const response: ErrorResponse = { error: error.message }
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

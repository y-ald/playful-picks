import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'stripe'
import { corsHeaders, stripeConfig } from './config.ts'
import { CheckoutRequest, CheckoutResponse, ErrorResponse } from './types.ts'

// Load environment variables
const env = Deno.env.toObject();
const stripeSecretKey = env.STRIPE_SECRET_KEY || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { cartItems, shippingAddress, shippingRate }: CheckoutRequest = await req.json()
    console.log('Received checkout request:', { cartItems, shippingAddress, shippingRate })
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not set');
    }

    const stripe = new Stripe(stripeSecretKey, stripeConfig)

    // Create line items from cart items
    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          images: item.product.image_url ? [item.product.image_url] : [],
        },
        unit_amount: Math.round(item.product.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    console.log('Creating Stripe session with line items:', lineItems)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkoutsuccess`,
      cancel_url: `${req.headers.get('origin')}/cart`,
      customer_email: shippingAddress.email,
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: Math.round(shippingRate.amount * 100), // Convert to cents
            currency: 'usd',
          },
          display_name: shippingRate.provider,
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: shippingRate.estimated_days,
            },
            maximum: {
              unit: 'business_day',
              value: shippingRate.estimated_days + 2,
            },
          },
        },
      }],
    })

    console.log('Created Stripe session:', session.id)

    const response: CheckoutResponse = { url: session.url }
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    const response: ErrorResponse = { error: error.message }
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

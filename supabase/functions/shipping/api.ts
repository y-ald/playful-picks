import { fetchWithTimeout } from "./utils.ts"

const SHIPPO_API_KEY = Deno.env.get('SHIPPO_API_KEY') || ''

const SHIPPO_API_URL = 'https://api.goshippo.com'

const headers = {
  'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
  'Content-Type': 'application/json',
}

const validateAddress = async (address: any) => {
  const response = await fetchWithTimeout(`${SHIPPO_API_URL}/addresses/validate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(address),
  })

  if (!response.ok) {
    throw new Error('Failed to validate address')
  }

  return await response.json()
}

const getRates = async (shipment: any) => {
  const response = await fetchWithTimeout(`${SHIPPO_API_URL}/shipments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(shipment),
  })

  if (!response.ok) {
    throw new Error('Failed to get rates')
  }

  const shipmentData = await response.json()
  return shipmentData.rates
}

const createLabel = async (transaction: any) => {
  const response = await fetchWithTimeout(`${SHIPPO_API_URL}/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(transaction),
  })

  if (!response.ok) {
    throw new Error('Failed to create label')
  }

  return await response.json()
}

const trackShipment = async (tracking: any) => {
  const response = await fetchWithTimeout(`${SHIPPO_API_URL}/tracks/${tracking.carrier}/${tracking.trackingNumber}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to track shipment')
  }

  return await response.json()
}

export { validateAddress, getRates, createLabel, trackShipment }

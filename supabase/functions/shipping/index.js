import Shippo from 'shippo';
import { createClient } from '@supabase/supabase-js';

const shippo = new Shippo(process.env.SHippo_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { action, payload } = req.body;

    switch (action) {
      case 'validateAddress':
        const address = await shippo.address.create(payload);
        const validation = await shippo.address.validate(address.object_id);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(validation);
        break;

      case 'getRates':
        const { fromAddress, toAddress, parcel } = payload;
        const shipment = await shippo.shipment.create({
          address_from: fromAddress,
          address_to: toAddress,
          parcels: [parcel],
          async: false
        });
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(shipment.rates);
        break;

      case 'createLabel':
        const { rateId } = payload;
        const transaction = await shippo.transaction.create({
          rate: rateId,
          async: false
        });
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(transaction);
        break;

      case 'trackShipment':
        const { carrier, trackingNumber } = payload;
        const tracking = await shippo.track.get(carrier, trackingNumber);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(tracking);
        break;

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Shipping API Error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(400).json({ error: error.message });
  }
}

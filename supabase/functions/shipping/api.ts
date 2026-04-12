import { fetchWithTimeout } from "./utils.ts";

const SHIPPO_API_KEY = Deno.env.get("SHIPPO_API_KEY") || "";
if (!SHIPPO_API_KEY) console.error("SHIPPO_API_KEY is not set - shipping operations will fail");

const SHIPPO_API_URL = "https://api.goshippo.com";

const headers = {
  Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
  "Content-Type": "application/json",
};

const createShipment = async (shipmentData: any) => {
  const response = await fetchWithTimeout(`${SHIPPO_API_URL}/shipments`, {
    method: "POST",
    headers,
    body: JSON.stringify(shipmentData),
  });

  if (!response.ok) {
    throw new Error("Failed to create shipment");
  }

  return await response.json();
};

const getRates = async (shipment: any) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1500;
  const payload = { ...shipment, async: false };

  console.log("getRates payload:", JSON.stringify(payload, null, 2));

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetchWithTimeout(`${SHIPPO_API_URL}/shipments`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`getRates attempt ${attempt} failed (${response.status}):`, errorBody);
      if (attempt === MAX_RETRIES) throw new Error(`Failed to get rates: ${errorBody}`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY * attempt));
      continue;
    }

    const shipmentData = await response.json();
    console.log(`getRates attempt ${attempt}: status=${shipmentData.status}, rates=${shipmentData.rates?.length ?? 0}, messages=${JSON.stringify(shipmentData.messages || [])}`);

    if (shipmentData.rates && shipmentData.rates.length > 0) {
      return shipmentData.rates;
    }

    if (attempt < MAX_RETRIES) {
      console.log(`Rates empty on attempt ${attempt}, retrying in ${RETRY_DELAY * attempt}ms...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY * attempt));
    }
  }

  return [];
};

const validateAddress = async (address: any) => {
  const response = await fetchWithTimeout(`${SHIPPO_API_URL}/addresses`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...address, validate: true }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Shippo address validation error:", errorText);
    throw new Error("Address validation request failed");
  }

  const result = await response.json();
  const validation = result.validation_results || {};

  return {
    is_valid: validation.is_valid ?? false,
    messages: (validation.messages || []).map((m: any) => ({
      code: m.code,
      text: m.text,
      type: m.type,
    })),
    suggested_address: validation.is_valid ? null : {
      street1: result.street1 || address.street1,
      street2: result.street2 || "",
      city: result.city || address.city,
      state: result.state || address.state,
      zip: result.zip || address.zip,
      country: result.country || address.country,
    },
  };
};

const createLabel = async (transaction: any) => {
  console.log("createLabel request", JSON.stringify(transaction));
  
  const metadata = typeof transaction.metadata === 'object' 
    ? JSON.stringify(transaction.metadata)
    : transaction.metadata;
  
  const requestBody = {
    ...transaction,
    metadata,
    label_file_type: "PDF",
    label_format: "PDF_4x6",
  };
  
  const response = await fetchWithTimeout(`${SHIPPO_API_URL}/transactions`, {
    method: "POST",
    headers: { ...headers, "SHIPPO-API-VERSION": "2018-02-08" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Shippo API error:", errorText);
    throw new Error(`Failed to create label: ${errorText}`);
  }

  const result = await response.json();
  console.log("createLabel response", JSON.stringify(result));
  return result;
};

const trackShipment = async (tracking: any) => {
  const response = await fetchWithTimeout(
    `${SHIPPO_API_URL}/tracks/${tracking.carrier}/${tracking.trackingNumber}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to track shipment");
  }

  return await response.json();
};

export { createShipment, getRates, createLabel, trackShipment, validateAddress };

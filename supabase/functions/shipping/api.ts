import { fetchWithTimeout } from "./utils.ts";

const SHIPPO_API_KEY = Deno.env.get("SHIPPO_API_KEY") || "";

const SHIPPO_API_URL = "https://api.goshippo.com";

const headers = {
  Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
  "Content-Type": "application/json",
};

/**
 * Creates a shipment via Shippo API
 * @param shipmentData - The shipment data including addresses and parcel
 * @returns The created shipment object
 */
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
  const response = await fetchWithTimeout(`${SHIPPO_API_URL}/shipments`, {
    method: "POST",
    headers,
    body: JSON.stringify(shipment),
  });

  if (!response.ok) {
    throw new Error("Failed to get rates");
  }

  const shipmentData = await response.json();
  return shipmentData.rates;
};

const createLabel = async (transaction: any) => {
  console.log("createLabel request", JSON.stringify(transaction));
  
  // Add label format for 4x6 label size (standard shipping label)
  const requestBody = {
    ...transaction,
    label_file_type: "PDF",
    label_format: "PDF_4x6", // 4x6 inch label size for standard thermal printers
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

export { createShipment, getRates, createLabel, trackShipment };

export interface ShippingRequest {
  action: string;
  payload: any;
}

export interface ShippingResponse {
  [key: string]: any;
}

export interface ErrorResponse {
  error: string;
}

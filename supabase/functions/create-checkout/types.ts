export interface CheckoutRequest {
  cartItems: {
    product: {
      id: string;
      name: string;
      price: number;
      image_url: string | null;
    };
    quantity: number;
  }[];
  shippingAddress: {
    email: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingRate: {
    amount: number;
    provider: string;
    estimated_days: number;
  };
}

export interface CheckoutResponse {
  url: string;
}

export interface ErrorResponse {
  error: string;
}

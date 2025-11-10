import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ShippingAddress {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PostPaymentProcessingOptions {
  cartItems: any[];
  shippingAddress: ShippingAddress;
  shippingRate: any;
  orderReference?: string;
}

/**
 * Hook for handling post-payment processing
 * - Creates shipping label via Shippo
 * - Sends label to store owner
 * - Sends tracking information to customer
 */
export const usePostPaymentProcessing = () => {
  const { toast } = useToast();
  const { userInfo } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Create shipping label and send emails
   */
  const processOrder = useCallback(
    async ({
      cartItems,
      shippingAddress,
      shippingRate,
      orderReference,
    }: PostPaymentProcessingOptions) => {
      setIsProcessing(true);

      try {
        // Step 1: Create shipping label via Shippo
        const { data: labelData, error: labelError } =
          await supabase.functions.invoke("shipping", {
            body: {
              action: "createLabel",
              payload: {
                rate: shippingRate.object_id,
                order_reference: orderReference || `order-${Date.now()}`,
                metadata: {
                  customer_email: shippingAddress.email,
                  customer_name: shippingAddress.name,
                },
              },
            },
          });

        if (labelError) throw labelError;

        // Step 2: Send label to store owner
        const { error: emailError } = await supabase.functions.invoke(
          "send-email",
          {
            body: {
              to: "hpaulfernand@yahoo.com",
              subject: `New Order: ${labelData.order_reference}`,
              html: `
                <h1>New Order: ${labelData.order_reference}</h1>
                <p>A new order has been placed and requires shipping.</p>
                <h2>Customer Information</h2>
                <p>Name: ${shippingAddress.name}</p>
                <p>Email: ${shippingAddress.email}</p>
                <p>Address: ${shippingAddress.address}, ${
                shippingAddress.city
              }, ${shippingAddress.state} ${shippingAddress.zipCode}, ${
                shippingAddress.country
              }</p>
                <h2>Order Details</h2>
                <ul>
                  ${cartItems
                    .map(
                      (item) => `
                    <li>
                      ${item.product.name} - Quantity: ${item.quantity} - $${(
                        item.product.price * item.quantity
                      ).toFixed(2)}
                    </li>
                  `
                    )
                    .join("")}
                </ul>
                <h2>Shipping Information</h2>
                <p>Carrier: ${shippingRate.provider}</p>
                <p>Service: ${shippingRate.servicelevel.name}</p>
                <p>Tracking Number: ${labelData.tracking_number}</p>
                <p>Estimated Delivery: ${shippingRate.estimated_days} days</p>
                <p><a href="${
                  labelData.label_url
                }" target="_blank">Download Shipping Label</a></p>
              `,
            },
          }
        );

        if (emailError) throw emailError;

        // Step 3: Send tracking information to customer
        const { error: customerEmailError } = await supabase.functions.invoke(
          "send-email",
          {
            body: {
              to: shippingAddress.email,
              subject: `Your Order Confirmation: ${labelData.order_reference}`,
              html: `
                <h1>Thank you for your order!</h1>
                <p>Your order has been confirmed and is being processed.</p>
                <h2>Order Details</h2>
                <ul>
                  ${cartItems
                    .map(
                      (item) => `
                    <li>
                      ${item.product.name} - Quantity: ${item.quantity} - $${(
                        item.product.price * item.quantity
                      ).toFixed(2)}
                    </li>
                  `
                    )
                    .join("")}
                </ul>
                <h2>Shipping Information</h2>
                <p>Carrier: ${shippingRate.provider}</p>
                <p>Service: ${shippingRate.servicelevel.name}</p>
                <p>Tracking Number: ${labelData.tracking_number}</p>
                <p>Estimated Delivery: ${shippingRate.estimated_days} days</p>
                <p><a href="${
                  labelData.tracking_url_provider
                }" target="_blank">Track Your Shipment</a></p>
                <h2>Shipping Address</h2>
                <p>${shippingAddress.name}</p>
                <p>${shippingAddress.address}</p>
                <p>${shippingAddress.city}, ${shippingAddress.state} ${
                shippingAddress.zipCode
              }</p>
                <p>${shippingAddress.country}</p>
              `,
            },
          }
        );

        if (customerEmailError) throw customerEmailError;

        toast({
          title: "Order processed successfully",
          description: "Shipping label created and emails sent",
        });

        return labelData;
      } catch (error) {
        console.error("Error processing order:", error);
        toast({
          variant: "destructive",
          title: "Error processing order",
          description: "Failed to create shipping label or send emails",
        });
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [toast, userInfo]
  );

  return {
    processOrder,
    isProcessing,
  };
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePostPaymentProcessing } from "@/hooks/usePostPaymentProcessing";
import { useCart } from "@/contexts/CartContext";
import { Loader2 } from "lucide-react";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { processOrder, isProcessing } = usePostPaymentProcessing();
  const { clearCart } = useCart();
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const handlePostPaymentProcessing = async () => {
      try {
        // Get checkout data from session storage
        const checkoutDataString = sessionStorage.getItem("checkout_data");
        if (!checkoutDataString) {
          // No checkout data found, skip post-payment processing
          setIsCompleted(true);
          return;
        }

        const checkoutData = JSON.parse(checkoutDataString);

        // Update the language if it was stored in the checkout data
        if (checkoutData.language && checkoutData.language !== language) {
          // This will update the app's language context
          navigate(`/${checkoutData.language}/checkout/success`, {
            replace: true,
          });
          return; // Stop processing as we're redirecting
        }

        // Process the order (create shipping label and send emails)
        await processOrder(checkoutData);

        // Clear checkout data from session storage
        sessionStorage.removeItem("checkout_data");

        // Clear cart using the cart context (handles both DB and local state)
        await clearCart();

        toast({
          title: "Success",
          description:
            "Thank you for your order! You will receive a confirmation email shortly.",
        });

        setIsCompleted(true);
      } catch (error) {
        console.error("Error processing order:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "There was an issue processing your order. Our team has been notified.",
        });
        setIsCompleted(true);
      }
    };

    handlePostPaymentProcessing();
  }, [toast, processOrder]);

  if (!isCompleted) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Processing Your Order</h1>
          <div className="flex justify-center mb-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground mb-6">
            Please wait while we process your order...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for your purchase. We've sent you an email with your order
          details and tracking information.
        </p>
        <Button onClick={() => navigate(`/${language}/shop`)}>
          Continue Shopping
        </Button>
      </Card>
    </div>
  );
}

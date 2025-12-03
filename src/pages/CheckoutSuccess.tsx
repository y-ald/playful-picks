import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { CheckCircle, Package, Truck } from "lucide-react";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const [isCleared, setIsCleared] = useState(false);

  useEffect(() => {
    const handlePostPayment = async () => {
      // Clear checkout data from session storage
      sessionStorage.removeItem("checkout_data");

      // Clear cart (Stripe webhook handles order creation, shipping label, and emails)
      if (!isCleared) {
        await clearCart();
        setIsCleared(true);
      }
    };

    handlePostPayment();
  }, [clearCart, isCleared]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Card className="max-w-lg w-full p-8 text-center space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-green-500 rounded-full p-4">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {language === "fr" ? "Commande confirmée!" : "Order Confirmed!"}
          </h1>
          <p className="text-muted-foreground">
            {language === "fr"
              ? "Merci pour votre achat"
              : "Thank you for your purchase"}
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-center gap-3 text-sm">
            <Package className="h-5 w-5 text-primary" />
            <span>
              {language === "fr"
                ? "Votre commande est en cours de préparation"
                : "Your order is being prepared"}
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm">
            <Truck className="h-5 w-5 text-primary" />
            <span>
              {language === "fr"
                ? "Vous recevrez un email avec les détails de suivi"
                : "You'll receive an email with tracking details"}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm">
          {language === "fr"
            ? "Un email de confirmation avec les informations de suivi vous sera envoyé sous peu."
            : "A confirmation email with tracking information will be sent to you shortly."}
        </p>

        {/* CTA Button */}
        <Button
          onClick={() => navigate(`/${language}/shop`)}
          size="lg"
          className="w-full"
        >
          {language === "fr" ? "Continuer vos achats" : "Continue Shopping"}
        </Button>
      </Card>
    </div>
  );
}

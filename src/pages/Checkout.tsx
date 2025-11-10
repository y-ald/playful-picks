import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ImprovedShippingForm from "@/components/ImprovedShippingForm";
import ImprovedShippingOptions from "@/components/ImprovedShippingOptions";
import OrderSummary from "@/components/OrderSummary";
import { ArrowLeft } from "lucide-react";
import { usePostPaymentProcessing } from "@/hooks/usePostPaymentProcessing";

// List of supported countries
const countries = [
  { name: "Canada", code: "CA" },
  { name: "United States", code: "US" },
  { name: "France", code: "FR" },
  { name: "Australia", code: "AU" },
  { name: "United Kingdom", code: "GB" },
  { name: "Belgium", code: "BE" },
  { name: "Spain", code: "ES" },
  { name: "Germany", code: "DE" },
];

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userInfo } = useAuth();
  const { cartItems, total } = location.state || { cartItems: [], total: 0 };
  const { language, translations } = useLanguage();
  const { processOrder, isProcessing } = usePostPaymentProcessing();

  // Handle shipping rates calculation
  const handleShippingRatesCalculated = (rates) => {
    setShippingRates(rates);
  };

  // Handle shipping rate selection
  const handleRateSelected = (rate) => {
    setSelectedRate(rate);
  };

  // Handle form submission
  const handleFormSubmit = (values) => {
    setFormValues(values);
    // Log the form values for debugging
    console.log("Form values:", values);
  };

  // Handle checkout submission
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Your cart is empty",
      });
      return;
    }

    if (!selectedRate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a shipping method",
      });
      return;
    }

    if (!formValues) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill out the shipping form",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: {
            cartItems,
            shippingAddress: formValues,
            shippingRate: selectedRate,
            language, // Pass the current language to the checkout function
          },
        }
      );

      if (error) throw error;

      if (data?.url) {
        // Store checkout data in session storage for post-payment processing
        sessionStorage.setItem(
          "checkout_data",
          JSON.stringify({
            cartItems,
            shippingAddress: formValues,
            shippingRate: selectedRate,
            orderReference: `order-${Date.now()}`,
            language, // Store language for post-payment processing
          })
        );

        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create checkout session",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle return to shop
  const handleReturnToShop = () => {
    navigate(`/${language}/shop`);
  };

  // Check for empty cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No items in cart</h2>
          <Button onClick={() => navigate(`/${language}/shop`)}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen container mx-auto p-4">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={handleReturnToShop}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translations.cart?.continueShopping || "Return to Shop"}
          </Button>
          <h1 className="text-4xl font-bold text-center">Checkout</h1>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr,400px]">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">
              Shipping Information
            </h2>
            <ImprovedShippingForm
              cartItems={cartItems}
              countries={countries}
              onShippingRatesCalculated={handleShippingRatesCalculated}
              onRateSelected={handleRateSelected}
              onFormSubmit={handleFormSubmit}
            />
            {/* Add a debug section to show the current state */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="text-sm font-semibold mb-2">Debug Info:</h3>
                <p className="text-xs">
                  Form Values: {formValues ? "Set" : "Not Set"}
                </p>
                <p className="text-xs">
                  Selected Rate:{" "}
                  {selectedRate
                    ? selectedRate.provider +
                      " - " +
                      selectedRate.servicelevel.name
                    : "None"}
                </p>
              </div>
            )}
            {shippingRates.length > 0 && (
              <ImprovedShippingOptions
                shippingRates={shippingRates}
                selectedRate={selectedRate}
                setSelectedRate={setSelectedRate}
                onSubmit={handleCheckout}
                loading={loading || isProcessing}
              />
            )}
          </Card>

          <OrderSummary
            cartItems={cartItems}
            total={total}
            selectedRate={selectedRate}
          />
        </div>
      </div>
    </div>
  );
}

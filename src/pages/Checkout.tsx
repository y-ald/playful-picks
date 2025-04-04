
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from '@/components/Navbar';
import { mapboxClient } from "@/integrations/mapbox/client";
import { calculateParcelSize } from "@/lib/calculateParcelSize";
import ShippingForm from "@/components/ShippingForm";
import ShippingOptions from "@/components/ShippingOptions";
import OrderSummary from "@/components/OrderSummary";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State/Province must be at least 2 characters"),
  zipCode: z.string().min(5, "Postal code must be at least 5 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  shipping_rate: z.string().optional(),
});

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
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cartItems, total } = location.state || { cartItems: [], total: 0 };
  const { language, translations } = useLanguage();
  const t = translations.checkout || {};

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "CA", // Default to Canada
      shipping_rate: "",
    },
  });

  const fetchShippingRates = async (values: z.infer<typeof formSchema>) => {
    try {
      const parcelSize = calculateParcelSize(cartItems.length);

      const { data, error } = await supabase.functions.invoke('shipping', {
        body: {
          action: 'getRates',
          payload: {
            address_from: {
              name: "Kaia Kids Store",
              street1: "123 Warehouse St",
              city: "Montreal",
              state: "QC",
              zip: "H2X 1Y6",
              country: "CA",
            },
            address_to: {
              name: values.name,
              street1: values.address,
              city: values.city,
              state: values.state,
              zip: values.zipCode,
              country: values.country,
            },
            parcels: [parcelSize],
          },
        },
      });

      if (error) throw error;

      setShippingRates(data);
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch shipping rates",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          cartItems,
          shippingAddress: values,
          shippingRate: selectedRate,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create checkout session",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToShop = () => {
    navigate(`/${language}/shop`);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No items in cart</h2>
          <Button onClick={() => navigate(`/${language}/shop`)}>Continue Shopping</Button>
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
            {translations.cart.continueShopping || "Return to Shop"}
          </Button>
          <h1 className="text-4xl font-bold text-center">Checkout</h1>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr,400px]">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>
            <ShippingForm
              form={form}
              countries={countries}
              handleAddressSubmit={fetchShippingRates}
              loading={loading}
            />
            {shippingRates.length > 0 && (
              <ShippingOptions
                shippingRates={shippingRates}
                selectedRate={selectedRate}
                setSelectedRate={setSelectedRate}
                onSubmit={form.handleSubmit(onSubmit)}
                loading={loading}
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

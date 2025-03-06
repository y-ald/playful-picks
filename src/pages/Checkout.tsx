import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from '@/components/Navbar';
import { mapboxClient } from "@/integrations/mapbox/client";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State/Province must be at least 2 characters"),
  zipCode: z.string().min(5, "Postal code must be at least 5 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  shipping_rate: z.string().optional(),
})

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
  const [loading, setLoading] = useState(false)
  const [shippingRates, setShippingRates] = useState([])
  const [selectedRate, setSelectedRate] = useState(null)
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { cartItems, total } = location.state || { cartItems: [], total: 0 }
  const { language, translations, setLanguage } = useLanguage();
  const t = translations.checkout || {};

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

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
  })

  const validateAddress = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('shipping', {
        body: {
          action: 'validateAddress',
          payload: {
            name: values.name,
            street1: values.address,
            city: values.city,
            state: values.state,
            zip: values.zipCode,
            country: values.country,
            validate: true,
          },
        },
      })

      if (error) throw error

      if (!data.validation_results.is_valid) {
        toast({
          variant: "destructive",
          title: "Invalid Address",
          description: "Please check your shipping address and try again.",
        })
        return false
      }

      return true
    } catch (error) {
      console.error('Address validation error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate address",
      })
      return false
    }
  }

  const fetchShippingRates = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data, error } = await supabase.functions.invoke('shipping', {
        body: {
          action: 'getRates',
          payload: {
            fromAddress: {
              name: "Kaia Kids Store",
              street1: "123 Warehouse St",
              city: "Montreal",
              state: "QC",
              zip: "H2X 1Y6",
              country: "CA",
            },
            toAddress: {
              name: values.name,
              street1: values.address,
              city: values.city,
              state: values.state,
              zip: values.zipCode,
              country: values.country,
            },
            parcel: {
              length: "20",
              width: "15",
              height: "10",
              distance_unit: "cm",
              weight: "1",
              mass_unit: "kg",
            },
          },
        },
      })

      if (error) throw error

      setShippingRates(data)
    } catch (error) {
      console.error('Error fetching shipping rates:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch shipping rates",
      })
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Your cart is empty",
      })
      return
    }

    if (!selectedRate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a shipping method",
      })
      return
    }

    setLoading(true)
    try {
      /* const isValidAddress = await validateAddress(values)
      if (!isValidAddress) {
        setLoading(false)
        return
      } */

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          cartItems,
          shippingAddress: values,
          shippingRate: selectedRate,
        },
      })

      if (error) throw error

      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create checkout session",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    form.setValue('address', query);

    if (query.length % 7 == 0) {
      const country = form.getValues('country');
      const languageCode = language === 'en' ? 'en' : 'fr';
      try {
        const suggestions = await mapboxClient.forward(query, languageCode, country);
        setAddressSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch address suggestions",
        });
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleAddressSelect = async (suggestion: any) => {
    try {
      const address = suggestion.properties.address;
      const context = suggestion.properties.context;

      form.setValue('address', address);

      // Extract city, state, and postal code from context
      const city = context.place.name;
      const state = context.region.name;
      const postalCode = context.postcode.name;

      if (city) form.setValue('city', city);
      if (state) form.setValue('state', state);
      if (postalCode) form.setValue('zipCode', postalCode);

      setSelectedSuggestion(null);
      setAddressSuggestions([]);
      await fetchShippingRates(form.getValues());
    } catch (error) {
      console.error('Error retrieving address details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to retrieve address details",
      });
    }
  };

  const handleAddressSubmit = async (values: z.infer<typeof formSchema>) => {
    const isValidAddress = await validateAddress(values)
    if (isValidAddress) {
      await fetchShippingRates(values)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No items in cart</h2>
          <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen container mx-auto p-4">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">{t.title}</h1>

        <div className="grid gap-8 md:grid-cols-[1fr,400px]">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddressSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.form?.name}</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.form?.email}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} className="text-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.form?.zipCode}</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.form?.country}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.form?.address}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="text-lg" 
                          onChange={handleAddressChange} 
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                      {addressSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-md rounded-b-md">
                          {addressSuggestions.map((suggestion: any) => (
                            <button
                              key={suggestion.properties.mapbox_id}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              onClick={() => handleAddressSelect(suggestion)}
                            >
                              {suggestion.properties.full_address}
                            </button>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.form?.city}</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.form?.state}</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-lg py-6" 
                  disabled={loading}
                >
                  {loading ? 'Loading...' : t.calculateShipping}
                </Button>
              </form>
            </Form>

            {shippingRates.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">{t.shippingOptions}</h3>
                <div className="space-y-4">
                  {shippingRates.map((rate: any) => (
                    <div
                      key={rate.object_id}
                      className="flex items-center justify-between p-4 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedRate(rate)}
                    >
                      <div>
                        <p className="font-medium">{rate.provider}</p>
                        <p className="text-sm text-gray-600">{rate.servicelevel.name}</p>
                        <p className="text-sm text-gray-600">
                          {t.estimatedDays.replace('{days}', rate.estimated_days)}
                        </p>
                      </div>
                      <div className="text-lg font-semibold">
                        ${parseFloat(rate.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  className="w-full text-lg py-6 mt-6" 
                  disabled={loading || !selectedRate}
                >
                  {loading ? "Processing..." : t.proceedToPayment}
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">{t.orderSummary}</h3>
              <div className="space-y-4">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium">
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-6 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{t.subtotal}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {selectedRate && (
                  <div className="flex justify-between items-center mt-2">
                    <span>{t.shipping}</span>
                    <span>${parseFloat(selectedRate.amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 text-xl font-bold">
                  <span>{t.total}</span>
                  <span>
                    ${(total + (selectedRate ? parseFloat(selectedRate.amount) : 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

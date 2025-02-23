import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const  Checkout = () => {
  const [loading, setLoading] = useState(false)
  const [shippingRates, setShippingRates] = useState([])
  const [selectedRate, setSelectedRate] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { cartItems, total } = location.state || { cartItems: [], total: 0 }

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

  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const fetchAddressSuggestions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('shipping', {
        body: {
          action: 'getAddressSuggestions',
          payload: {
            street1: form.watch('address'),
            city: form.watch('city'),
            state: form.watch('state'),
            zip: form.watch('zipCode'),
            country: form.watch('country'),
          },
        },
      });

      if (error) throw error;

      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch address suggestions",
      });
    }
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'address' && value.address.length > 3) {
        fetchAddressSuggestions();
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleSuggestionClick = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    form.setValue('address', suggestion.street1);
    form.setValue('city', suggestion.city);
    form.setValue('state', suggestion.state);
    form.setValue('zipCode', suggestion.zip_code);
    form.setValue('country', suggestion.country);
    setSuggestions([]);
  };

  const validateAddress = async (values: z.infer<typeof formSchema>) => {
    try {
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

  const fetchShippingRates = async () => {
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
              name: form.watch('name'),
              street1: form.watch('address'),
              city: form.watch('city'),
              state: form.watch('state'),
              zip: form.watch('zipCode'),
              country: form.watch('country'),
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
      const isValidAddress = await validateAddress(values)
      if (!isValidAddress) {
        setLoading(false)
        return
      }

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

  const handleAddressSubmit = async (values: z.infer<typeof formSchema>) => {
    const isValidAddress = await validateAddress(values)
    if (isValidAddress) {
      await fetchShippingRates();
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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Checkout</h1>

        <div className="grid gap-8 md:grid-cols-[1fr,400px]">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddressSubmit)} className="space-y-6 relative">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} className="text-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-lg" />
                      </FormControl>
                      <FormMessage />
                      {suggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {suggestions.map((suggestion: any) => (
                            <li
                              key={suggestion.street1}
                              className="cursor-pointer p-2 hover:bg-gray-100"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion.street1}, {suggestion.city}, {suggestion.state}, {suggestion.zip_code}, {suggestion.country}
                            </li>
                          ))}
                        </ul>
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
                        <FormLabel>City</FormLabel>
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
                        <FormLabel>Province/State</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
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
                        <FormLabel>Country</FormLabel>
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
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                          </SelectContent>
                        </Select>
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
                  {loading ? "Processing..." : "Calculate Shipping"}
                </Button>
              </form>
            </Form>

            {shippingRates.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Shipping Options</h3>
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
                          Estimated delivery: {rate.estimated_days} days
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
                  {loading ? "Processing..." : "Proceed to Payment"}
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
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
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {selectedRate && (
                  <div className="flex justify-between items-center mt-2">
                    <span>Shipping</span>
                    <span>${parseFloat(selectedRate.amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 text-xl font-bold">
                  <span>Total</span>
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

export default Checkout;

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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
})

export default function Checkout() {
  const [loading, setLoading] = useState(false)
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
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Your cart is empty",
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          cartItems,
          shippingAddress: values,
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-3">
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
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
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
                  {loading ? "Processing..." : "Proceed to Payment"}
                </Button>
              </form>
            </Form>
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
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
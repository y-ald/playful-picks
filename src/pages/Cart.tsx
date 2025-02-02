import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image_url: string | null
  }
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCartItems()
  }, [])

  const fetchCartItems = async () => {
    try {
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product:products (
            id,
            name,
            price,
            image_url
          )
        `)

      if (cartError) throw cartError

      setCartItems(cartData as CartItem[])
    } catch (error) {
      console.error('Error fetching cart items:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load cart items",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error

      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update quantity",
      })
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setCartItems(items => items.filter(item => item.id !== itemId))
      toast({
        title: "Success",
        description: "Item removed from cart",
      })
    } catch (error) {
      console.error('Error removing item:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item",
      })
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity)
    }, 0)
  }

  const handleCheckout = () => {
    navigate('/checkout', { 
      state: { 
        cartItems,
        total: calculateTotal()
      }
    })
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading cart...</div>
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
      
      <div className="grid gap-4 md:grid-cols-[1fr,300px]">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex gap-4">
                {item.product.image_url && (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product.name}</h3>
                  <p className="text-muted-foreground">
                    ${item.product.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="ml-auto"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="flex justify-between mb-4">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <Button className="w-full" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
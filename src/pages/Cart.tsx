import { useEffect, useState, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useCartStorage } from "@/hooks/useCartStorage"
import { useCart } from "@/hooks/useCart"
import { useLanguage } from "@/contexts/LanguageContext"
import { supabase } from "@/integrations/supabase/client"


interface CartItem {
  id: string
  quantity: number
  product_id: string
  product: {
    id: string
    name: string
    price: number
    image_url: string | null
  } | null
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { language, translations, setLanguage } = useLanguage();
  const location = useLocation();

  const { cartItems: storageCartItems, addToCart, updateQuantity, removeItem, calculateTotal } = useCart();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);
      const productIds = storageCartItems.map((item) => item.product_id);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .in("id", productIds);

      if (productsError) throw productsError;

      const productsMap = (productsData || []).reduce((acc: Record<string, any>, product: any) => {
        acc[product.id] = product;
        return acc;
      }, {});

      const updatedCartItems: CartItem[] = storageCartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product_id: item.product_id,
        product: productsMap[item.product_id] || null,
      }));

      setCartItems(updatedCartItems);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load cart items",
      });
    } finally {
      setLoading(false);
    }
  }, [storageCartItems, toast]);

  // useEffect to fetch data on mount and when storageCartItems change
  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const handleCheckout = () => {
    navigate(`/${language}/checkout`, { 
      state: { 
        cartItems,
        total: calculateTotal(cartItems)
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
        <Button onClick={() => navigate(`/${language}/shop`)}>Continue Shopping</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
      
      <div className="grid gap-4 md:grid-cols-[1fr,300px]">
        <div className="space-y-4">
          {cartItems.map((item) => (
            item.product && (
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
            )
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="flex justify-between mb-4">
              <span>Total</span>
              <span>${calculateTotal(cartItems).toFixed(2)}</span>
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

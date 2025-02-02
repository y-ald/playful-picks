import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

export default function CheckoutSuccess() {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const clearCart = async () => {
      try {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .neq('id', '')  // Delete all items

        if (error) throw error

        toast({
          title: "Success",
          description: "Thank you for your order!",
        })
      } catch (error) {
        console.error('Error clearing cart:', error)
      }
    }

    clearCart()
  }, [toast])

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for your purchase. We'll send you an email with your order details shortly.
        </p>
        <Button onClick={() => navigate('/shop')}>
          Continue Shopping
        </Button>
      </Card>
    </div>
  )
}
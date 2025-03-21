import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OrderSummaryProps {
  cartItems: any[];
  total: number;
  selectedRate: any;
}

export default function OrderSummary({ cartItems, total, selectedRate }: OrderSummaryProps) {
  return (
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
  );
}

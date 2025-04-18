import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CheckoutItemRow from "./CheckoutItemRow";

interface OrderSummaryProps {
  cartItems: any[];
  total: number;
  selectedRate: any;
}

export default function OrderSummary({
  cartItems,
  total,
  selectedRate,
}: OrderSummaryProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
      <div className="space-y-4">
        {cartItems.map((item: any) => (
          <CheckoutItemRow key={item.id} item={item} />
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
            $
            {(
              total + (selectedRate ? parseFloat(selectedRate.amount) : 0)
            ).toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
}

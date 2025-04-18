import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";

interface CartItemProps {
  item: {
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: number;
      image_url: string | null;
    } | null;
  };
}

// Using memo to prevent unnecessary re-renders when other cart items change
const CartItemRow = memo(({ item }: CartItemProps) => {
  const { updateQuantity, removeItem } = useCart();

  // Memoize callback functions to prevent unnecessary re-renders
  const handleIncrement = useCallback(() => {
    updateQuantity(item.id, item.quantity + 1);
  }, [item.id, item.quantity, updateQuantity]);

  const handleDecrement = useCallback(() => {
    updateQuantity(item.id, item.quantity - 1);
  }, [item.id, item.quantity, updateQuantity]);

  const handleRemove = useCallback(() => {
    removeItem(item.id);
  }, [item.id, removeItem]);

  // If product is null, don't render anything
  if (!item.product) return null;

  return (
    <Card className="p-4">
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
            <Button variant="outline" size="icon" onClick={handleDecrement}>
              -
            </Button>
            <span>{item.quantity}</span>
            <Button variant="outline" size="icon" onClick={handleIncrement}>
              +
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="ml-auto"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

// Set display name for debugging
CartItemRow.displayName = "CartItemRow";

export default CartItemRow;

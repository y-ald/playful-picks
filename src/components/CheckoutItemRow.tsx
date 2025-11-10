import { memo } from "react";

interface CheckoutItemProps {
  item: {
    id: string;
    quantity: number;
    product?: {
      id: string;
      name: string;
      price: number;
      image_url: string | null;
    } | null;
  };
}

// Using memo to prevent unnecessary re-renders when other cart items change
const CheckoutItemRow = memo(({ item }: CheckoutItemProps) => {
  // If product is null, don't render anything
  if (!item.product) return null;

  const itemTotal = (item.product.price || 0) * item.quantity;

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        {item.product.image_url && (
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="w-16 h-16 object-cover rounded"
          />
        )}
        <div>
          <p className="font-medium">{item.product.name}</p>
          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
        </div>
      </div>
      <span className="font-medium">${itemTotal.toFixed(2)}</span>
    </div>
  );
});

// Set display name for debugging
CheckoutItemRow.displayName = "CheckoutItemRow";

export default CheckoutItemRow;

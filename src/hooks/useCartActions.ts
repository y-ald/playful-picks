
import { useToast } from '@/components/ui/use-toast';
import { useCartStorage } from '@/hooks/useCartStorage';

export const useCartActions = () => {
  const { toast } = useToast();
  const { addToCart: addItem, updateQuantity: updateItem, removeItem: removeCartItem, calculateTotal } = useCartStorage();
  
  const addToCart = async (productId: string) => {
    try {
      await addItem(productId, 1);
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
    } catch (error) {
      console.error('Error in addToCart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add item to cart",
      });
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await updateItem(itemId, newQuantity);
      toast({
        title: "Quantity Updated",
        description: "Item quantity has been updated",
      });
    } catch (error) {
      console.error('Error in updateQuantity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update item quantity",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await removeCartItem(itemId);
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error('Error in removeItem:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item from cart",
      });
    }
  };

  return {
    addToCart,
    updateQuantity,
    removeItem,
    calculateTotal,
  };
};

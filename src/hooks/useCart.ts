import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useCartStorage } from '@/hooks/useCartStorage';

export const useCart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { cartItems, addToCart, updateQuantity, removeItem, calculateTotal } = useCartStorage();
  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
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

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await updateQuantity(itemId, newQuantity);
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

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
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
    cartItems,
    addToCart: handleAddToCart,
    updateQuantity: handleUpdateQuantity,
    removeItem: handleRemoveItem,
    calculateTotal,
  };
};

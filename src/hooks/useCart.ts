
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';

// Generate a random client ID for anonymous users
const generateClientId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const useCart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for existing client ID
    const existingClientId = localStorage.getItem('cart_client_id');
    if (existingClientId) {
      setClientId(existingClientId);
    } else {
      // Generate and store new client ID
      const newClientId = generateClientId();
      localStorage.setItem('cart_client_id', newClientId);
      setClientId(newClientId);
    }
  }, []);

  const addToCart = async (productId: string) => {
    try {
      // Get current user and client ID
      const { data: { user } } = await supabase.auth.getUser();
      const currentClientId = user ? null : clientId;

      const { data: existingItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('product_id', productId)
        .eq(user ? 'user_id' : 'client_id', user ? user.id : currentClientId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingItem) {
        // Update quantity if item exists
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Insert new item if it doesn't exist
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert([{ 
            product_id: productId, 
            quantity: 1,
            user_id: user?.id || null,
            client_id: currentClientId
          }]);

        if (insertError) throw insertError;
      }

      // Invalidate cart count query to update the badge
      await queryClient.invalidateQueries({ queryKey: ['cartCount'] });

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

  return {
    addToCart,
    clientId,
  };
};

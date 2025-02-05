import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useCart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToCart = async (productId: string) => {
    try {
      const { data: existingItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
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
          .insert([{ product_id: productId, quantity: 1 }]);

        if (insertError) throw insertError;
      }

      // Invalidate cart count query to update the badge
      await queryClient.invalidateQueries({ queryKey: ['cartCount'] });
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw error;
    }
  };

  return {
    addToCart,
  };
};
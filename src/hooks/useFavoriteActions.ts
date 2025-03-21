
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useFavoriteActions = (clientId: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToFavorites = async (productId: string) => {
    if (!clientId) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .insert([{ client_id: clientId, product_id: productId }]);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      
      toast({
        title: "Added to favorites",
        description: "Item has been added to your favorites",
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add to favorites",
      });
    }
  };

  const removeFromFavorites = async (productId: string) => {
    if (!clientId) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('client_id', clientId)
        .eq('product_id', productId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      
      toast({
        title: "Removed from favorites",
        description: "Item has been removed from your favorites",
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove from favorites",
      });
    }
  };

  return {
    addToFavorites,
    removeFromFavorites
  };
};

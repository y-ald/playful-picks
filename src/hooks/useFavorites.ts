import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FAVORITES_ID_KEY = 'anonymous_favorites_id';

export const useFavorites = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check if there's an existing client ID
    const storedClientId = localStorage.getItem(FAVORITES_ID_KEY);
    if (storedClientId) {
      setClientId(storedClientId);
    } else {
      // Generate a new client ID
      const newClientId = crypto.randomUUID();
      localStorage.setItem(FAVORITES_ID_KEY, newClientId);
      setClientId(newClientId);
    }
  }, []);

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('*, product:products(*)')
        .eq('client_id', clientId);

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const addToFavorites = async (productId: string) => {
    if (!clientId) return;

    const { error } = await supabase
      .from('favorites')
      .insert([{ client_id: clientId, product_id: productId }]);

    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
  };

  const removeFromFavorites = async (productId: string) => {
    if (!clientId) return;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('client_id', clientId)
      .eq('product_id', productId);

    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
  };

  const isFavorite = (productId: string) => {
    return favorites.some(fav => fav.product_id === productId);
  };

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  };
};

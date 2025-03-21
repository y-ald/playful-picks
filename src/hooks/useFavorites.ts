
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFavoriteActions } from '@/hooks/useFavoriteActions';

const FAVORITES_ID_KEY = 'anonymous_favorites_id';

export const useFavorites = () => {
  const [clientId, setClientId] = useState<string | null>(null);

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

  const { addToFavorites, removeFromFavorites } = useFavoriteActions(clientId);

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

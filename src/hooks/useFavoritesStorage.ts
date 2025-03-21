import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';

const FAVORITES_ID_KEY = 'anonymous_favorites_id';
const FAVORITES_TIMESTAMP_KEY = 'favorites_timestamp';
const STORAGE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useFavoritesStorage = () => {
  const [favoritesId, setFavoritesId] = useState<string | null>(null);
  const isAuthenticated = useAuthStatus();

  useEffect(() => {
    const initializeFavorites = async () => {
      if (isAuthenticated) {
        // Fetch favorites from the database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching favorites:', error);
          return;
        }

        setFavoritesId(data.map((item: any) => item.product_id).join(','));
      } else {
        // Check if there's an existing favorites ID and if it's still valid
        const storedFavoritesId = localStorage.getItem(FAVORITES_ID_KEY);
        const timestamp = localStorage.getItem(FAVORITES_TIMESTAMP_KEY);
        const now = Date.now();

        if (storedFavoritesId && timestamp) {
          const timePassed = now - parseInt(timestamp);
          if (timePassed < STORAGE_TIMEOUT) {
            setFavoritesId(storedFavoritesId);
            return;
          }
        }

        // Clear expired favorites
        localStorage.removeItem(FAVORITES_ID_KEY);
        localStorage.removeItem(FAVORITES_TIMESTAMP_KEY);
        setFavoritesId(null);
      }
    };

    initializeFavorites();
  }, [isAuthenticated]);

  const createNewFavorites = async () => {
    const newFavoritesId = crypto.randomUUID();
    localStorage.setItem(FAVORITES_ID_KEY, newFavoritesId);
    localStorage.setItem(FAVORITES_TIMESTAMP_KEY, Date.now().toString());
    setFavoritesId(newFavoritesId);
    return newFavoritesId;
  };

  const getOrCreateFavoritesId = async () => {
    if (!favoritesId) {
      return await createNewFavorites();
    }
    return favoritesId;
  };

  const addToFavorites = async (productId: string) => {
    if (isAuthenticated) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, product_id: productId }]);

      if (error) {
        console.error('Error adding to favorites:', error);
        return;
      }

      setFavoritesId((prevId) => {
        const newIds = prevId ? `${prevId},${productId}` : productId;
        return newIds;
      });
    } else {
      const currentFavorites = localStorage.getItem(FAVORITES_ID_KEY || '') || '';
      const newFavorites = currentFavorites ? `${currentFavorites},${productId}` : productId;
      localStorage.setItem(FAVORITES_ID_KEY || '', newFavorites);
      localStorage.setItem(FAVORITES_TIMESTAMP_KEY, Date.now().toString());
      setFavoritesId(newFavorites);
    }
  };

  const removeFromFavorites = async (productId: string) => {
    if (isAuthenticated) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing from favorites:', error);
        return;
      }

      setFavoritesId((prevId) => {
        const newIds = prevId ? prevId.split(',').filter(id => id !== productId).join(',') : '';
        return newIds;
      });
    } else {
      const currentFavorites = localStorage.getItem(FAVORITES_ID_KEY || '') || '';
      const newFavorites = currentFavorites.split(',').filter(id => id !== productId).join(',');
      localStorage.setItem(FAVORITES_ID_KEY || '', newFavorites);
    }
  };

  const isFavorite = (productId: string) => {
    if (isAuthenticated) {
      return favoritesId?.split(',').includes(productId) || false;
    } else {
      return favoritesId ? localStorage.getItem(FAVORITES_ID_KEY).split(',').includes(productId) : false;
    }
  };

  return { favoritesId, getOrCreateFavoritesId, addToFavorites, removeFromFavorites, isFavorite };
};

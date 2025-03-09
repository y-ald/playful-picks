import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const FAVORITES_ID_KEY = 'anonymous_favorites_id';
const FAVORITES_TIMESTAMP_KEY = 'favorites_timestamp';
const STORAGE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useFavoritesStorage = () => {
  const [favoritesId, setFavoritesId] = useState<string | null>(null);

  useEffect(() => {
    const initializeFavorites = () => {
      // Check if there's an existing favorites ID and if it's still valid
      const storedFavoritesId = Cookies.get(FAVORITES_ID_KEY);
      const timestamp = Cookies.get(FAVORITES_TIMESTAMP_KEY);
      const now = Date.now();

      if (storedFavoritesId && timestamp) {
        const timePassed = now - parseInt(timestamp);
        if (timePassed < STORAGE_TIMEOUT) {
          setFavoritesId(storedFavoritesId);
          return;
        }
      }

      // Clear expired favorites
      Cookies.remove(FAVORITES_ID_KEY);
      Cookies.remove(FAVORITES_TIMESTAMP_KEY);
      setFavoritesId(null);
    };

    initializeFavorites();
  }, []);

  const createNewFavorites = async () => {
    const newFavoritesId = crypto.randomUUID();
    Cookies.set(FAVORITES_ID_KEY, newFavoritesId, { expires: STORAGE_TIMEOUT / (1000 * 60 * 60) });
    Cookies.set(FAVORITES_TIMESTAMP_KEY, Date.now().toString(), { expires: STORAGE_TIMEOUT / (1000 * 60 * 60) });
    setFavoritesId(newFavoritesId);
    return newFavoritesId;
  };

  const getOrCreateFavoritesId = async () => {
    if (!favoritesId) {
      return await createNewFavorites();
    }
    return favoritesId;
  };

  return { favoritesId, getOrCreateFavoritesId };
};

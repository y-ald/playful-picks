import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CART_ID_KEY = 'anonymous_cart_id';
const CART_TIMESTAMP_KEY = 'cart_timestamp';
const STORAGE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export const useCartStorage = () => {
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    const initializeCart = async () => {
      // Check if there's an existing cart ID and if it's still valid
      const storedCartId = localStorage.getItem(CART_ID_KEY);
      const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);
      const now = Date.now();

      if (storedCartId && timestamp) {
        const timePassed = now - parseInt(timestamp);
        if (timePassed < STORAGE_TIMEOUT) {
          setCartId(storedCartId);
          return;
        }
      }

      // Clear expired cart
      localStorage.removeItem(CART_ID_KEY);
      localStorage.removeItem(CART_TIMESTAMP_KEY);
      setCartId(null);
    };

    initializeCart();

    // Set up cleanup interval
    const interval = setInterval(() => {
      const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);
      if (timestamp && Date.now() - parseInt(timestamp) >= STORAGE_TIMEOUT) {
        localStorage.removeItem(CART_ID_KEY);
        localStorage.removeItem(CART_TIMESTAMP_KEY);
        setCartId(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const createNewCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: cart } = await supabase
      .from('cart_items')
      .insert([{ user_id: user?.id || null }])
      .select()
      .single();

    if (cart) {
      localStorage.setItem(CART_ID_KEY, cart.id);
      localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
      setCartId(cart.id);
      return cart.id;
    }
    return null;
  };

  const getOrCreateCartId = async () => {
    if (!cartId) {
      return await createNewCart();
    }
    return cartId;
  };

  return { cartId, getOrCreateCartId };
};
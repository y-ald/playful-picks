
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { v4 as uuidv4 } from 'uuid';

const CART_KEY = 'cart';
const CART_TIMESTAMP_KEY = 'cart_timestamp';
const STORAGE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useCartStorage = () => {
  const [cartItems, setCartItems] = useState([]);
  const isAuthenticated = useAuthStatus();

  // Function to fetch cart items
  const fetchCartItems = async () => {
    if (isAuthenticated) {
      // Fetch cart items from the database for authenticated users
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching cart items:', error);
          return;
        }

        setCartItems(data);
      }
    } else {
      // Check if there's an existing cart in localStorage and if it's still valid
      const storedCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);
      const now = Date.now();

      if (timestamp) {
        const timePassed = now - parseInt(timestamp);
        if (timePassed < STORAGE_TIMEOUT) {
          setCartItems(storedCart);
          return;
        }
      }

      // Clear expired cart
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(CART_TIMESTAMP_KEY);
      setCartItems([]);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const { data: { user } } = supabase.auth.getUser();
      
      const channel = supabase
        .channel('custom-filter-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user?.id}`,
          },
          () => {
            fetchCartItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity: number) => {
    if (isAuthenticated) {
      // Add to database for authenticated users
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: existingItem, error: fetchError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('product_id', productId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching cart item:', fetchError);
          return;
        }

        if (existingItem) {
          // Update quantity if item exists
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);

          if (updateError) console.error('Error updating cart item:', updateError);
        } else {
          // Insert new item if it doesn't exist
          const { data: insertedItem, error: insertError } = await supabase
            .from('cart_items')
            .insert([{ 
              product_id: productId, 
              quantity: quantity,
              user_id: user.id,
            }])
            .select()
            .single();

          if (insertError) console.error('Error inserting cart item:', insertError);
          if (insertedItem) setCartItems([...cartItems, insertedItem]);
        }
      }
    } else {
      // Add to localStorage for unauthenticated users
      var storedCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const existingItemIndex = storedCart.findIndex(item => item.product_id === productId);

      if (existingItemIndex !== -1) {
        // If the item exists, update its quantity
        storedCart[existingItemIndex].quantity += quantity;
      } else {
        // If the item doesn't exist, add as new
        storedCart = [...storedCart, {id: uuidv4(), product_id: productId, quantity: quantity }];
      }
      localStorage.setItem(CART_KEY, JSON.stringify(storedCart));
      localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
      setCartItems(storedCart);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (isAuthenticated) {
      // Update in database for authenticated users
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: updatedItem, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', itemId)
          .select()
          .single();

        if (updateError) console.error('Error updating cart item:', updateError);
        if (updatedItem) {
          setCartItems(cartItems.map(item => 
            item.id === itemId ? updatedItem : item
          ));
        }
      }
    } else {
      // Update in localStorage for unauthenticated users
      const storedCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const updatedCartItems = storedCart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      localStorage.setItem(CART_KEY, JSON.stringify(updatedCartItems));
      setCartItems(updatedCartItems);
    }
  };

  const removeItem = async (itemId: string) => {
    if (isAuthenticated) {
      // Remove from database for authenticated users
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);

        if (error) console.error('Error removing cart item:', error);
        setCartItems(cartItems.filter(item => item.id !== itemId));
      }
    } else {
      // Remove from localStorage for unauthenticated users
      const storedCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const updatedCartItems = storedCart.filter(item => item.id !== itemId);
      localStorage.setItem(CART_KEY, JSON.stringify(updatedCartItems));
      setCartItems(updatedCartItems);
    }
  };

  const calculateTotal = (items: any[]) => {
    return items.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  return { cartItems, addToCart, updateQuantity, removeItem, calculateTotal };
};


import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';

interface NavigationContextType {
  cartCount: number;
  favoritesCount: number;
  updateCartCount: (count?: number) => void;
  updateFavoritesCount: (count?: number) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const isAuthenticated = useAuthStatus();
  const queryClient = useQueryClient();

  // Fetch initial counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (isAuthenticated) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get cart count
          const { data: cartItems, error: cartError } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('user_id', user.id);
          
          if (!cartError && cartItems) {
            const total = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
            setCartCount(total);
          }
          
          // Get favorites count
          const { count, error: favError } = await supabase
            .from('favorites')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id);
          
          if (!favError) {
            setFavoritesCount(count || 0);
          }
        }
      } else {
        // Handle anonymous users with localStorage
        const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartTotal = storedCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(cartTotal);
        
        const clientId = localStorage.getItem('anonymous_favorites_id');
        if (clientId) {
          const { count, error } = await supabase
            .from('favorites')
            .select('*', { count: 'exact' })
            .eq('client_id', clientId);
          
          if (!error) {
            setFavoritesCount(count || 0);
          }
        }
      }
    };
    
    fetchCounts();
    
    // Setup subscription for real-time updates
    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const cartChannel = supabase
          .channel('cart-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'cart_items',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              // Invalidate cart queries
              queryClient.invalidateQueries({ queryKey: ['cart'] });
              // Update cart count
              fetchCounts();
            }
          )
          .subscribe();
          
        const favChannel = supabase
          .channel('fav-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'favorites',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              // Invalidate favorites queries
              queryClient.invalidateQueries({ queryKey: ['favorites'] });
              // Update favorites count
              fetchCounts();
            }
          )
          .subscribe();
          
        return () => {
          supabase.removeChannel(cartChannel);
          supabase.removeChannel(favChannel);
        };
      }
    };
    
    const unsubscribe = setupSubscriptions();
    
    return () => {
      if (unsubscribe) {
        unsubscribe.then(fn => fn && fn());
      }
    };
  }, [isAuthenticated, queryClient]);
  
  // Update counts manually (for when we don't have real-time updates)
  const updateCartCount = useCallback((count?: number) => {
    if (count !== undefined) {
      setCartCount(count);
    } else {
      // If no count provided, refetch
      const fetchCartCount = async () => {
        if (isAuthenticated) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: cartItems, error: cartError } = await supabase
              .from('cart_items')
              .select('quantity')
              .eq('user_id', user.id);
            
            if (!cartError && cartItems) {
              const total = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
              setCartCount(total);
            }
          }
        } else {
          const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
          const cartTotal = storedCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
          setCartCount(cartTotal);
        }
      };
      
      fetchCartCount();
    }
  }, [isAuthenticated]);
  
  const updateFavoritesCount = useCallback((count?: number) => {
    if (count !== undefined) {
      setFavoritesCount(count);
    } else {
      // If no count provided, refetch
      const fetchFavoritesCount = async () => {
        if (isAuthenticated) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { count, error: favError } = await supabase
              .from('favorites')
              .select('*', { count: 'exact' })
              .eq('user_id', user.id);
            
            if (!favError) {
              setFavoritesCount(count || 0);
            }
          }
        } else {
          const clientId = localStorage.getItem('anonymous_favorites_id');
          if (clientId) {
            const { count, error } = await supabase
              .from('favorites')
              .select('*', { count: 'exact' })
              .eq('client_id', clientId);
            
            if (!error) {
              setFavoritesCount(count || 0);
            }
          }
        }
      };
      
      fetchFavoritesCount();
    }
  }, [isAuthenticated]);
  
  return (
    <NavigationContext.Provider value={{ 
      cartCount, 
      favoritesCount, 
      updateCartCount, 
      updateFavoritesCount 
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
};

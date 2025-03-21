import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';

export const useMergeCart = () => {
  const isAuthenticated = useAuthStatus();

  useEffect(() => {
    if (isAuthenticated) {
      const mergeCart = async () => {
        const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const { data: { user } } = await supabase.auth.getUser();

        if (user && storedCart.length > 0) {
          // Insert stored cart items into the database
          const { error } = await supabase
            .from('cart_items')
            .insert(storedCart.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              user_id: user.id,
            })));

          if (error) {
            console.error('Error merging cart:', error);
            return;
          }

          // Clear localStorage after successful merge
          localStorage.removeItem('cart');
          localStorage.removeItem('cart_timestamp');
        }
      };

      mergeCart();
    }
  }, [isAuthenticated]);
};

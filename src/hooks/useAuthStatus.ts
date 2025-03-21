
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return isAuthenticated;
};

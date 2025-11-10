import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface NavigationContextType {
  cartCount: number;
  favoritesCount: number;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, userInfo } = useAuth();
  const { cartItems } = useCart();
  const { favorites } = useFavorites();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    if (!isAuthenticated || !userInfo) {
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userInfo.id)
        .maybeSingle();
      
      setIsAdmin(!!data?.is_admin);
    };

    checkAdmin();
  }, [isAuthenticated, userInfo]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      cartCount: cartItems?.length || 0,
      favoritesCount: favorites?.length || 0,
      isAuthenticated,
      isAdmin,
    }),
    [cartItems, favorites, isAuthenticated, isAdmin]
  );

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);

  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }

  return context;
};

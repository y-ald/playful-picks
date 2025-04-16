import { createContext, useContext, ReactNode } from "react";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

interface NavigationContextType {
  cartCount: number;
  favoritesCount: number;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  // Get cart and favorites counts from their respective contexts
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();

  return (
    <NavigationContext.Provider
      value={{
        cartCount,
        favoritesCount,
      }}
    >
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

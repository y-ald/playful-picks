import { createContext, useContext, ReactNode, useMemo } from "react";
import { useNavbarData } from "@/hooks/useNavbarData";

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
  // Use our optimized hook that centralizes data fetching
  const { cartCount, favoritesCount, isAuthenticated, isAdmin } =
    useNavbarData();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      cartCount,
      favoritesCount,
      isAuthenticated,
      isAdmin,
    }),
    [cartCount, favoritesCount, isAuthenticated, isAdmin]
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

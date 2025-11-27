import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataSyncManager } from "@/components/DataSyncManager";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import AppRoutes from "./AppRoutes";

/**
 * Main application component
 * Sets up providers and global state management
 */
function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes default stale time
        retry: 1, // Limit retries
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            {/* DataSyncManager handles merging local and remote data */}
            <DataSyncManager>
              <CartProvider>
                <FavoritesProvider>
                  <NavigationProvider>
                    <Navbar />
                    <AppRoutes />
                    <Footer />
                    <Toaster />
                  </NavigationProvider>
                </FavoritesProvider>
              </CartProvider>
            </DataSyncManager>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

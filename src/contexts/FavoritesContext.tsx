import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

// Constants
const FAVORITES_ID_KEY = "anonymous_favorites_id";
const FAVORITES_TIMESTAMP_KEY = "favorites_timestamp";
const STORAGE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Types
export interface FavoriteItem {
  id: string;
  product_id: string;
  user_id?: string;
  client_id?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    description?: string;
  } | null;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  favoritesCount: number;
  isLoading: boolean;
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => Promise<void>;
}

// Create context
const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

// Provider component
export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, userInfo } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate favorites count
  const favoritesCount = useMemo(() => favorites.length, [favorites]);

  // Initialize client ID for anonymous users
  useEffect(() => {
    if (!isAuthenticated) {
      // Check if there's an existing client ID
      const storedClientId = localStorage.getItem(FAVORITES_ID_KEY);
      if (storedClientId) {
        setClientId(storedClientId);
      } else {
        // Generate a new client ID
        const newClientId = crypto.randomUUID();
        localStorage.setItem(FAVORITES_ID_KEY, newClientId);
        setClientId(newClientId);
      }
    }
  }, [isAuthenticated]);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated && userInfo) {
        const { data, error } = await supabase
          .from("favorites")
          .select("*, product:products(*)")
          .eq("user_id", userInfo.id);

        if (error) {
          console.error("Error fetching favorites:", error);
          return;
        }

        setFavorites(data || []);
      } else if (clientId) {
        // Fetch favorites for anonymous users
        const { data, error } = await supabase
          .from("favorites")
          .select("*, product:products(*)")
          .eq("client_id", clientId);

        if (error) {
          console.error("Error fetching favorites:", error);
          return;
        }

        setFavorites(data || []);
      }
    } catch (error) {
      console.error("Error in fetchFavorites:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load favorites",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userInfo, clientId, toast]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated || clientId) {
      fetchFavorites();
    }
  }, [fetchFavorites, isAuthenticated, clientId]);

  // Set up real-time subscription for authenticated users
  useEffect(() => {
    if (isAuthenticated && userInfo) {
      const channel = supabase
        .channel("favorites-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "favorites",
            filter: `user_id=eq.${userInfo.id}`,
          },
          () => {
            fetchFavorites();
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, userInfo, fetchFavorites, queryClient]);

  // Add to favorites
  const addToFavorites = useCallback(
    async (productId: string) => {
      try {
        if (isAuthenticated && userInfo) {
          const { data: existingFavorite, error: checkError } = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", userInfo.id)
            .eq("product_id", productId)
            .maybeSingle();

          if (checkError) {
            console.error("Error checking favorite:", checkError);
            throw checkError;
          }

          if (existingFavorite) {
            toast({
              title: "Already in favorites",
              description: "This item is already in your favorites",
            });
            return;
          }

          const { error: insertError } = await supabase
            .from("favorites")
            .insert([{ user_id: userInfo.id, product_id: productId }]);

          if (insertError) {
            console.error("Error adding to favorites:", insertError);
            throw insertError;
          }

          fetchFavorites();
        } else if (clientId) {
          // Add to database for anonymous users
          // Check if already in favorites
          const { data: existingFavorite, error: checkError } = await supabase
            .from("favorites")
            .select("id")
            .eq("client_id", clientId)
            .eq("product_id", productId)
            .maybeSingle();

          if (checkError) {
            console.error("Error checking favorite:", checkError);
            throw checkError;
          }

          if (existingFavorite) {
            // Already in favorites
            toast({
              title: "Already in favorites",
              description: "This item is already in your favorites",
            });
            return;
          }

          // Add to favorites
          const { error: insertError } = await supabase
            .from("favorites")
            .insert([
              {
                client_id: clientId,
                product_id: productId,
              },
            ]);

          if (insertError) {
            console.error("Error adding to favorites:", insertError);
            throw insertError;
          }

          // Fetch updated favorites
          fetchFavorites();
        }

        toast({
          title: "Added to favorites",
          description: "Item has been added to your favorites",
        });
      } catch (error) {
        console.error("Error in addToFavorites:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add item to favorites",
        });
        throw error;
      }
    },
    [isAuthenticated, userInfo, clientId, fetchFavorites, toast]
  );

  const removeFromFavorites = useCallback(
    async (productId: string) => {
      try {
        if (isAuthenticated && userInfo) {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", userInfo.id)
            .eq("product_id", productId);

          if (error) {
            console.error("Error removing from favorites:", error);
            throw error;
          }

          fetchFavorites();
        } else if (clientId) {
          // Remove from database for anonymous users
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("client_id", clientId)
            .eq("product_id", productId);

          if (error) {
            console.error("Error removing from favorites:", error);
            throw error;
          }

          // Fetch updated favorites
          fetchFavorites();
        }

        toast({
          title: "Removed from favorites",
          description: "Item has been removed from your favorites",
        });
      } catch (error) {
        console.error("Error in removeFromFavorites:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove item from favorites",
        });
        throw error;
      }
    },
    [isAuthenticated, userInfo, clientId, fetchFavorites, toast]
  );

  // Check if product is in favorites
  const isFavorite = useCallback(
    (productId: string) => {
      return favorites.some((favorite) => favorite.product_id === productId);
    },
    [favorites]
  );

  // Clear all favorites
  const clearFavorites = useCallback(async () => {
    try {
      if (isAuthenticated && userInfo) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userInfo.id);

        if (error) {
          console.error("Error clearing favorites:", error);
          throw error;
        }
      } else if (clientId) {
        // Clear database favorites for anonymous users
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("client_id", clientId);

        if (error) {
          console.error("Error clearing favorites:", error);
          throw error;
        }
      }

      // Update state
      setFavorites([]);

      toast({
        title: "Favorites Cleared",
        description: "Your favorites have been cleared",
      });
    } catch (error) {
      console.error("Error in clearFavorites:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear favorites",
      });
      throw error;
    }
  }, [isAuthenticated, userInfo, clientId, toast]);

  // Context value
  const value = useMemo(
    () => ({
      favorites,
      favoritesCount,
      isLoading,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      clearFavorites,
    }),
    [
      favorites,
      favoritesCount,
      isLoading,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      clearFavorites,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

// Hook to use the favorites context
export const useFavorites = () => {
  const context = useContext(FavoritesContext);

  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }

  return context;
};

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

// Constants
const FAVORITES_ID_KEY = "anonymous_favorites_id";
const FAVORITES_TIMESTAMP_KEY = "favorites_timestamp";
const MERGE_COMPLETED_KEY = "favorites_merge_completed";

/**
 * Custom hook for merging local favorites with remote favorites on login
 * Handles conflict resolution and ensures merge only happens once per session
 */
export const useMergeFavorites = () => {
  const { isAuthenticated, userInfo } = useAuth();
  const { toast } = useToast();
  const mergeAttempted = useRef(false);

  useEffect(() => {
    // Only run merge once when user becomes authenticated
    if (isAuthenticated && userInfo && !mergeAttempted.current) {
      const mergeFavorites = async () => {
        // Check if merge was already completed for this session
        const mergeCompleted = sessionStorage.getItem(
          `${MERGE_COMPLETED_KEY}_${userInfo.id}`
        );
        if (mergeCompleted === "true") {
          return;
        }

        // Get client ID for anonymous favorites
        const clientId = localStorage.getItem(FAVORITES_ID_KEY);
        if (!clientId) {
          // No local favorites to merge, mark as completed
          sessionStorage.setItem(
            `${MERGE_COMPLETED_KEY}_${userInfo.id}`,
            "true"
          );
          return;
        }

        try {
          // Get anonymous favorites
          const { data: anonymousFavorites, error: anonError } = await supabase
            .from("favorites")
            .select("product_id")
            .eq("client_id", clientId);

          if (anonError) {
            console.error("Error fetching anonymous favorites:", anonError);
            throw anonError;
          }

          if (!anonymousFavorites || anonymousFavorites.length === 0) {
            // No anonymous favorites to merge
            sessionStorage.setItem(
              `${MERGE_COMPLETED_KEY}_${userInfo.id}`,
              "true"
            );
            return;
          }

          // Get user favorites
          const { data: userFavorites, error: userError } = await supabase
            .from("favorites")
            .select("product_id")
            .eq("user_id", userInfo.id);

          if (userError) {
            console.error("Error fetching user favorites:", userError);
            throw userError;
          }

          // Create a set of user's favorite product IDs for quick lookup
          const userFavoriteSet = new Set(
            userFavorites?.map((item) => item.product_id) || []
          );

          // Find favorites that need to be transferred (exist in anonymous but not in user)
          const favoritesToTransfer = anonymousFavorites.filter(
            (item) => !userFavoriteSet.has(item.product_id)
          );

          if (favoritesToTransfer.length > 0) {
            // Insert new favorites for the user
            const { error: insertError } = await supabase
              .from("favorites")
              .insert(
                favoritesToTransfer.map((item) => ({
                  user_id: userInfo.id,
                  product_id: item.product_id,
                }))
              );

            if (insertError) {
              console.error("Error transferring favorites:", insertError);
              throw insertError;
            }
          }

          // Delete anonymous favorites
          const { error: deleteError } = await supabase
            .from("favorites")
            .delete()
            .eq("client_id", clientId);

          if (deleteError) {
            console.error("Error deleting anonymous favorites:", deleteError);
            throw deleteError;
          }

          // Clear localStorage
          localStorage.removeItem(FAVORITES_ID_KEY);
          localStorage.removeItem(FAVORITES_TIMESTAMP_KEY);

          // Mark merge as completed for this session
          sessionStorage.setItem(
            `${MERGE_COMPLETED_KEY}_${userInfo.id}`,
            "true"
          );

          // Notify user if favorites were transferred
          if (favoritesToTransfer.length > 0) {
            toast({
              title: "Favorites synchronized",
              description: `${favoritesToTransfer.length} items added to your favorites`,
            });
          }
        } catch (error) {
          console.error("Error merging favorites:", error);
          toast({
            variant: "destructive",
            title: "Sync error",
            description: "Failed to synchronize your favorites",
          });
        }
      };

      mergeFavorites();
      mergeAttempted.current = true;
    }
  }, [isAuthenticated, userInfo, toast]);
};

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

// Constants
const CART_KEY = "cart";
const CART_TIMESTAMP_KEY = "cart_timestamp";
const MERGE_COMPLETED_KEY = "cart_merge_completed";

/**
 * Custom hook for merging local cart with remote cart on login
 * Handles conflict resolution and ensures merge only happens once per session
 */
export const useMergeCart = () => {
  const { isAuthenticated, userInfo } = useAuth();
  const { toast } = useToast();
  const mergeAttempted = useRef(false);

  useEffect(() => {
    // Only run merge once when user becomes authenticated
    if (isAuthenticated && userInfo && !mergeAttempted.current) {
      const mergeCart = async () => {
        // Check if merge was already completed for this session
        const mergeCompleted = sessionStorage.getItem(
          `${MERGE_COMPLETED_KEY}_${userInfo.id}`
        );
        if (mergeCompleted === "true") {
          return;
        }

        // Get local cart
        const storedCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        if (storedCart.length === 0) {
          // No local cart to merge, mark as completed
          sessionStorage.setItem(
            `${MERGE_COMPLETED_KEY}_${userInfo.id}`,
            "true"
          );
          return;
        }

        try {
          // Get remote cart
          const { data: remoteCart, error: fetchError } = await supabase
            .from("cart_items")
            .select("*")
            .eq("user_id", userInfo.id);

          if (fetchError) {
            console.error("Error fetching remote cart:", fetchError);
            throw fetchError;
          }

          // Create a map of product_id -> remote cart item
          const remoteCartMap = new Map();
          remoteCart?.forEach((item) => {
            remoteCartMap.set(item.product_id, item);
          });

          // Process each local cart item
          for (const localItem of storedCart) {
            const remoteItem = remoteCartMap.get(localItem.product_id);

            if (remoteItem) {
              // Item exists in both carts - update quantity
              const newQuantity = remoteItem.quantity + localItem.quantity;
              const { error: updateError } = await supabase
                .from("cart_items")
                .update({ quantity: newQuantity })
                .eq("id", remoteItem.id);

              if (updateError) {
                console.error("Error updating cart item:", updateError);
                throw updateError;
              }
            } else {
              // Item only exists locally - add to remote cart
              const { error: insertError } = await supabase
                .from("cart_items")
                .insert({
                  product_id: localItem.product_id,
                  quantity: localItem.quantity,
                  user_id: userInfo.id,
                });

              if (insertError) {
                console.error("Error inserting cart item:", insertError);
                throw insertError;
              }
            }
          }

          // Clear localStorage after successful merge
          localStorage.removeItem(CART_KEY);
          localStorage.removeItem(CART_TIMESTAMP_KEY);

          // Mark merge as completed for this session
          sessionStorage.setItem(
            `${MERGE_COMPLETED_KEY}_${userInfo.id}`,
            "true"
          );

          // Notify user
          toast({
            title: "Cart synchronized",
            description: "Your shopping cart has been synchronized",
          });
        } catch (error) {
          console.error("Error merging cart:", error);
          toast({
            variant: "destructive",
            title: "Sync error",
            description: "Failed to synchronize your cart",
          });
        }
      };

      mergeCart();
      mergeAttempted.current = true;
    }
  }, [isAuthenticated, userInfo, toast]);
};

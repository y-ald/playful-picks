import { useMergeCart } from "@/hooks/useMergeCart";
import { useMergeFavorites } from "@/hooks/useMergeFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect } from "react";

interface DataSyncManagerProps {
  children: ReactNode;
}

/**
 * Component that manages data synchronization between local storage and remote database
 * Handles merging cart and favorites when a user logs in
 */
export const DataSyncManager = ({ children }: DataSyncManagerProps) => {
  const { isAuthenticated } = useAuth();

  // Use the merge hooks to handle data synchronization
  useMergeCart();
  useMergeFavorites();

  // Clear session storage on logout
  useEffect(() => {
    if (!isAuthenticated) {
      // Find and remove all merge completion markers from session storage
      Object.keys(sessionStorage).forEach((key) => {
        if (
          key.startsWith("cart_merge_completed_") ||
          key.startsWith("favorites_merge_completed_")
        ) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, [isAuthenticated]);

  return <>{children}</>;
};

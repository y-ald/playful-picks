import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Custom hook that provides optimized authentication data for the navbar.
 * Admin status is fetched once per session and kept in React Query's in-memory
 * cache (no localStorage) to avoid client-side tampering of UI flags.
 */
export function useNavbarData() {
  const { isAuthenticated, userInfo } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const adminCheckInProgress = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      if (!isAuthenticated || !userInfo || adminCheckInProgress.current) {
        if (isMounted && !isAuthenticated) {
          setIsAdmin(false);
        }
        return;
      }

      // Use React Query's in-memory cache instead of localStorage
      const cached = queryClient.getQueryData<boolean>([
        "adminStatus",
        userInfo.id,
      ]);
      if (typeof cached === "boolean") {
        if (isMounted) setIsAdmin(cached);
        return;
      }

      adminCheckInProgress.current = true;
      setIsAdminLoading(true);

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userInfo.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Error fetching admin status:", error);
          throw error;
        }

        const adminStatus = !!data;

        if (isMounted) {
          setIsAdmin(adminStatus);
        }
        queryClient.setQueryData(["adminStatus", userInfo.id], adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setIsAdminLoading(false);
        adminCheckInProgress.current = false;
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, userInfo, queryClient]);

  return useMemo(
    () => ({
      isAuthenticated,
      userInfo,
      isAdmin,
      isAdminLoading,
    }),
    [isAuthenticated, userInfo, isAdmin, isAdminLoading]
  );
}

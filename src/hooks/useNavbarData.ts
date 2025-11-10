import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "./useCart";
import { useFavorites } from "./useFavorites";

// Cache key for admin status
const ADMIN_CACHE_KEY = "user_admin_status";
const ADMIN_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

interface CachedAdminStatus {
  isAdmin: boolean;
  userId: string;
  timestamp: number;
}

/**
 * Custom hook that provides optimized authentication data for the navbar
 * Centralizes data fetching and prevents unnecessary re-renders
 */
export function useNavbarData() {
  const { isAuthenticated, userInfo } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const adminCheckInProgress = useRef(false);
  const queryClient = useQueryClient();
  
  // Get cart and favorites data
  const { cartItems } = useCart();
  const { favorites } = useFavorites();
  
  const cartCount = cartItems?.length || 0;
  const favoritesCount = favorites?.length || 0;

  // Get cached admin status
  const getCachedAdminStatus = useCallback(() => {
    if (!userInfo) return null;

    const cachedData = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!cachedData) return null;

    try {
      const parsed = JSON.parse(cachedData) as CachedAdminStatus;
      const now = Date.now();

      // Check if cache is still valid and belongs to current user
      if (
        now - parsed.timestamp < ADMIN_CACHE_EXPIRY &&
        parsed.userId === userInfo.id
      ) {
        return parsed.isAdmin;
      }
    } catch (error) {
      console.error("Error parsing cached admin status:", error);
    }

    return null;
  }, [userInfo]);

  // Set cached admin status
  const setCachedAdminStatus = useCallback(
    (status: boolean) => {
      if (!userInfo) return;

      const cacheData: CachedAdminStatus = {
        isAdmin: status,
        userId: userInfo.id,
        timestamp: Date.now(),
      };
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(cacheData));
    },
    [userInfo]
  );

  // Check admin status only when authenticated
  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      // Skip if not authenticated or check already in progress
      if (!isAuthenticated || !userInfo || adminCheckInProgress.current) {
        if (isMounted && !isAuthenticated) {
          setIsAdmin(false);
        }
        return;
      }

      // First check cache
      const cachedStatus = getCachedAdminStatus();
      if (cachedStatus !== null) {
        if (isMounted) {
          setIsAdmin(cachedStatus);
        }
        return;
      }

      // If not in cache, fetch from database
      adminCheckInProgress.current = true;
      setIsAdminLoading(true);

      try {
        // Get admin status from profile using the userInfo we already have
        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", userInfo.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching admin status:", error);
          throw error;
        }

        const adminStatus = !!data?.is_admin;

        if (isMounted) {
          setIsAdmin(adminStatus);
          setCachedAdminStatus(adminStatus);
        }

        // Cache in React Query for components that might need this data
        queryClient.setQueryData(["adminStatus", userInfo.id], adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsAdminLoading(false);
        }
        adminCheckInProgress.current = false;
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [
    isAuthenticated,
    userInfo,
    getCachedAdminStatus,
    setCachedAdminStatus,
    queryClient,
  ]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      isAuthenticated,
      userInfo,
      isAdmin,
      isAdminLoading,
      cartCount,
      favoritesCount,
    }),
    [isAuthenticated, userInfo, isAdmin, isAdminLoading, cartCount, favoritesCount]
  );
}

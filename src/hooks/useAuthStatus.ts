import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

// Improved cache settings
const AUTH_CACHE_KEY = "auth_user_data";
const AUTH_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour cache duration
const SESSION_REFRESH_INTERVAL = 23 * 60 * 60 * 1000; // 23 hours (just before Supabase's 24h default)

interface CachedAuthData {
  user: User | null;
  timestamp: number;
}

/**
 * Custom hook for managing authentication status
 * Optimized to minimize unnecessary API calls while maintaining session validity
 */
export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const authInitialized = useRef<boolean>(false);
  const queryClient = useQueryClient();

  // Get cached auth data
  const getCachedAuthData = useCallback((): CachedAuthData | null => {
    const cachedData = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cachedData) return null;

    try {
      const parsed = JSON.parse(cachedData) as CachedAuthData;
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsed.timestamp < AUTH_CACHE_EXPIRY) {
        return parsed;
      }
    } catch (error) {
      console.error("Error parsing cached auth data:", error);
    }

    return null;
  }, []);

  // Set cached auth data
  const setCachedAuthData = useCallback((user: User | null) => {
    const cacheData: CachedAuthData = {
      user,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cacheData));
  }, []);

  // Handle auth state changes
  const handleAuthChange = useCallback(
    (session: Session | null) => {
      const newAuthState = !!session?.user;

      // Update auth state
      setIsAuthenticated(newAuthState);
      setUserInfo(session?.user || null);
      setSession(session);

      // Update cache
      if (session?.user) {
        setCachedAuthData(session.user);
      } else {
        localStorage.removeItem(AUTH_CACHE_KEY);
      }

      // Invalidate related queries when auth state changes
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      return newAuthState;
    },
    [setCachedAuthData, queryClient]
  );

  // Initialize auth state once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (authInitialized.current) return;

      setIsLoading(true);

      try {
        // First try to use cached data for immediate UI response
        const cachedData = getCachedAuthData();
        if (cachedData?.user) {
          setIsAuthenticated(true);
          setUserInfo(cachedData.user);
        }

        // Then get the actual session from Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Update state based on the session
        handleAuthChange(session);

        // Mark as initialized
        authInitialized.current = true;
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [getCachedAuthData, handleAuthChange]);

  // Set up auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [handleAuthChange]);

  // Set up session refresh timer to keep the session alive
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh session periodically to prevent expiration
    const refreshTimer = setInterval(async () => {
      try {
        // Silently refresh the session
        await supabase.auth.refreshSession();
      } catch (error) {
        console.error("Error refreshing session:", error);
      }
    }, SESSION_REFRESH_INTERVAL);

    return () => {
      clearInterval(refreshTimer);
    };
  }, [isAuthenticated]);

  // Force refresh auth (used when needed)
  const refreshAuth = useCallback(async () => {
    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      handleAuthChange(session);
    } catch (error) {
      console.error("Error refreshing auth:", error);
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthChange]);

  return {
    isAuthenticated,
    userInfo,
    isLoading,
    session,
    refreshAuth,
  };
};

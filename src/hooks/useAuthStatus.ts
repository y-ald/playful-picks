import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

// Global auth state to ensure single source of truth
// This prevents multiple instances of the hook from creating duplicate state
interface GlobalAuthState {
  isAuthenticated: boolean;
  userInfo: User | null;
  session: Session | null;
  isLoading: boolean;
  initialized: boolean;
  authFetchPromise: Promise<void> | null;
}

// Initialize global state
const globalAuthState: GlobalAuthState = {
  isAuthenticated: false,
  userInfo: null,
  session: null,
  isLoading: true,
  initialized: false,
  authFetchPromise: null,
};

// Cache settings
const AUTH_CACHE_KEY = "auth_user_data";
const AUTH_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour cache duration
const SESSION_REFRESH_INTERVAL = 23 * 60 * 60 * 1000; // 23 hours (just before Supabase's 24h default)

interface CachedAuthData {
  user: User | null;
  session: Session | null;
  timestamp: number;
}

/**
 * Custom hook for managing authentication status
 * Implements a true single source of truth for auth data across the application
 */
export const useAuthStatus = () => {
  // Use state to trigger re-renders when global state changes
  const [, setRenderTrigger] = useState({});
  const queryClient = useQueryClient();

  // Function to update global state and trigger re-renders
  const updateGlobalState = useCallback((updates: Partial<GlobalAuthState>) => {
    Object.assign(globalAuthState, updates);
    setRenderTrigger({}); // Trigger re-render
  }, []);

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
  const setCachedAuthData = useCallback(
    (user: User | null, session: Session | null) => {
      const cacheData: CachedAuthData = {
        user,
        session,
        timestamp: Date.now(),
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cacheData));
    },
    []
  );

  // Handle auth state changes
  const handleAuthChange = useCallback(
    (session: Session | null) => {
      const newAuthState = !!session?.user;
      const user = session?.user || null;

      // Only update if there's an actual change
      if (
        newAuthState !== globalAuthState.isAuthenticated ||
        JSON.stringify(user) !== JSON.stringify(globalAuthState.userInfo) ||
        JSON.stringify(session) !== JSON.stringify(globalAuthState.session)
      ) {
        // Update global state
        updateGlobalState({
          isAuthenticated: newAuthState,
          userInfo: user,
          session: session,
        });

        // Update cache
        if (session?.user) {
          setCachedAuthData(session.user, session);
        } else {
          localStorage.removeItem(AUTH_CACHE_KEY);
        }

        // Invalidate related queries when auth state changes
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["favorites"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });

        console.log(
          "Auth state updated:",
          newAuthState ? "authenticated" : "unauthenticated"
        );
      }

      return newAuthState;
    },
    [updateGlobalState, setCachedAuthData, queryClient]
  );

  // Initialize auth state once for the entire application
  useEffect(() => {
    const initializeAuth = async () => {
      // If already initialized or initialization is in progress, don't do it again
      if (globalAuthState.initialized || globalAuthState.authFetchPromise) {
        return;
      }

      updateGlobalState({ isLoading: true });

      // Create a promise to track the auth fetch
      const authPromise = (async () => {
        try {
          // First try to use cached data for immediate UI response
          const cachedData = getCachedAuthData();
          if (cachedData?.user) {
            updateGlobalState({
              isAuthenticated: true,
              userInfo: cachedData.user,
              session: cachedData.session,
            });
          }

          // Then get the actual session from Supabase (only once per app load)
          const {
            data: { session },
          } = await supabase.auth.getSession();

          // Update state based on the session
          handleAuthChange(session);

          // Mark as initialized
          updateGlobalState({
            initialized: true,
            isLoading: false,
            authFetchPromise: null,
          });

          console.log("Auth initialization complete");
        } catch (error) {
          console.error("Error initializing auth:", error);
          updateGlobalState({
            isLoading: false,
            authFetchPromise: null,
          });
        }
      })();

      // Store the promise in global state to prevent duplicate calls
      updateGlobalState({ authFetchPromise: authPromise });

      // Wait for the promise to complete
      await authPromise;
    };

    initializeAuth();
  }, [getCachedAuthData, handleAuthChange, updateGlobalState]);

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
    if (!globalAuthState.isAuthenticated) return;

    // Refresh session periodically to prevent expiration
    const refreshTimer = setInterval(async () => {
      try {
        // Silently refresh the session
        const { data } = await supabase.auth.refreshSession();
        if (data.session) {
          handleAuthChange(data.session);
        }
      } catch (error) {
        console.error("Error refreshing session:", error);
      }
    }, SESSION_REFRESH_INTERVAL);

    return () => {
      clearInterval(refreshTimer);
    };
  }, [globalAuthState.isAuthenticated, handleAuthChange]);

  // Force refresh auth (used when needed)
  const refreshAuth = useCallback(async () => {
    // If a refresh is already in progress, wait for it
    if (globalAuthState.authFetchPromise) {
      await globalAuthState.authFetchPromise;
      return;
    }

    updateGlobalState({ isLoading: true });

    const authPromise = (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        handleAuthChange(session);
      } catch (error) {
        console.error("Error refreshing auth:", error);
      } finally {
        updateGlobalState({
          isLoading: false,
          authFetchPromise: null,
        });
      }
    })();

    updateGlobalState({ authFetchPromise: authPromise });
    await authPromise;
  }, [handleAuthChange, updateGlobalState]);

  // Return the global state values
  return {
    isAuthenticated: globalAuthState.isAuthenticated,
    userInfo: globalAuthState.userInfo,
    isLoading: globalAuthState.isLoading,
    session: globalAuthState.session,
    refreshAuth,
    // Add a method to get user without an API call
    getUser: () => globalAuthState.userInfo,
  };
};

// Export a function to get the current user without using the hook
// This is useful for utilities that need the user but don't want to use a hook
export const getCurrentUser = (): User | null => {
  return globalAuthState.userInfo;
};

// Export a function to get the current session without using the hook
export const getCurrentSession = (): Session | null => {
  return globalAuthState.session;
};

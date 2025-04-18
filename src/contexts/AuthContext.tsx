import { createContext, useContext, ReactNode } from "react";
import {
  useAuthStatus,
  getCurrentUser,
  getCurrentSession,
} from "@/hooks/useAuthStatus";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  userInfo: User | null;
  isLoading: boolean;
  session: Session | null;
  refreshAuth: () => Promise<void>;
  getUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component for authentication context
 * Provides authentication state and methods to the entire application
 * Uses a global singleton pattern to ensure only one auth state exists
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Use the optimized hook that minimizes unnecessary API calls
  const auth = useAuthStatus();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access authentication context
 * Provides authentication state and methods to components
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

/**
 * Utility function to get the current user without using a hook
 * This is useful for utilities and services that need the user but can't use hooks
 */
export const getAuthUser = (): User | null => {
  return getCurrentUser();
};

/**
 * Utility function to get the current session without using a hook
 * This is useful for utilities and services that need the session but can't use hooks
 */
export const getAuthSession = (): Session | null => {
  return getCurrentSession();
};

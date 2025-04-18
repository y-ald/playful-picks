import { createContext, useContext, ReactNode } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  userInfo: User | null;
  isLoading: boolean;
  session: Session | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component for authentication context
 * Provides authentication state and methods to the entire application
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

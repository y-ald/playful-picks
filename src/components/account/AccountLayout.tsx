
import { ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { Loader2, Home } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AccountLayoutProps {
  children: ReactNode;
}

export function AccountLayout({ children }: AccountLayoutProps) {
  const isAuthenticated = useAuthStatus();
  const location = useLocation();
  const { lang } = useParams<{ lang: string }>();
  
  // While checking auth status, show loading
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    return <Navigate to={`/${lang}/auth`} state={{ from: location }} replace />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <Link to={`/${lang}`}>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <AccountNav />
        </div>
        <div className="md:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Search, LogIn, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavbarData } from "@/hooks/useNavbarData";

// Component implementation
function NavbarIconsComponent() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use our optimized hook for authentication and admin status
  const { isAuthenticated, isAdmin } = useNavbarData();

  // Get cart and favorites counts directly from their contexts
  // to ensure they're always available regardless of auth status
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();

  // Extracted to a separate function to improve readability
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Error",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });

    navigate(`/${language}`);
  };

  return (
    <div className="flex items-center space-x-4">
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
        <Search className="w-5 h-5 text-gray-600" />
      </button>
      <Link
        to={`/${language}/favorites`}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
      >
        <Heart className="w-5 h-5 text-gray-600" />
        {favoritesCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-fade-in">
            {favoritesCount}
          </span>
        )}
      </Link>
      <Link
        to={`/${language}/cart`}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
      >
        <ShoppingCart className="w-5 h-5 text-gray-600" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-fade-in">
            {cartCount}
          </span>
        )}
      </Link>

      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full transition-colors outline-none">
            <User className="w-5 h-5 text-gray-600" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/${language}/account`)}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(`/${language}/account/addresses`)}
            >
              Addresses
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem
                onClick={() => navigate(`/${language}/account/admin`)}
              >
                Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleSignOut}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link
          to={`/${language}/auth`}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Login/Signup"
        >
          <LogIn className="w-5 h-5 text-gray-600" />
        </Link>
      )}
    </div>
  );
}

// Export memoized version
export const NavbarIcons = memo(NavbarIconsComponent);

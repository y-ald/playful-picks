
import { Link, useLocation } from 'react-router-dom';
import { Heart, ShoppingCart, Search, LogIn, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useCartStorage } from '@/hooks/useCartStorage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';

export const NavbarIcons = () => {
  const clientId = localStorage.getItem('anonymous_favorites_id');
  const { language, translations, setLanguage } = useLanguage();
  const location = useLocation();
  const isAuthenticated = useAuthStatus();
  const { cartItems } = useCartStorage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isAuthenticated) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
            
          setIsAdmin(!!data?.is_admin);
        }
      }
    };
    
    checkAdminStatus();
  }, [isAuthenticated]);

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

  const { data: favoritesCount = 0 } = useQuery({
    queryKey: ['favoritesCount', clientId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact' })
        .eq('client_id', clientId || '');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!clientId
  });

  return (
    <div className="flex items-center space-x-4">
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
        <Search className="w-5 h-5 text-gray-600" />
      </button>
      <Link to={`/${language}/favorites`} className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
        <Heart className="w-5 h-5 text-gray-600" />
        {favoritesCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-fade-in">
            {favoritesCount}
          </span>
        )}
      </Link>
      <Link to={`/${language}/cart`} className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
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
            <DropdownMenuItem onClick={() => navigate(`/${language}/account/addresses`)}>
              Addresses
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate(`/${language}/account/admin`)}>
                Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
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
};

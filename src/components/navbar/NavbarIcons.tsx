import { Link, useLocation } from 'react-router-dom';
import { Heart, ShoppingCart, Search, LogIn } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export const NavbarIcons = () => {
  const clientId = localStorage.getItem('anonymous_favorites_id');
  const { language, translations, setLanguage } = useLanguage();
  const location = useLocation();
  

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const { data: cartCount = 0 } = useQuery({
    queryKey: ['cartCount'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact' });
      
      if (error) {
        console.error('Error fetching cart count:', error);
        return 0;
      }
      
      return data?.length || 0;
    },
    refetchInterval: 1000
  });

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
      <Link 
        to={`/${language}/auth`} 
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Login/Signup"
      >
        <LogIn className="w-5 h-5 text-gray-600" />
      </Link>
    </div>
  );
};

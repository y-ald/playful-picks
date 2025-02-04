import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Menu, X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const clientId = localStorage.getItem('anonymous_favorites_id');

  // Fetch cart items count
  const { data: cartCount = 0 } = useQuery({
    queryKey: ['cartCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact' });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch favorites count
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
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/lovable-uploads/82389159-6492-4264-a7c0-37e526f8b3a4.png" alt="Kaia Kids" className="h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary transition-colors">Home</Link>
            <Link to="/shop" className="text-gray-600 hover:text-primary transition-colors">Shop</Link>
            <Link to="/blog" className="text-gray-600 hover:text-primary transition-colors">Blog</Link>
            <Link to="/about" className="text-gray-600 hover:text-primary transition-colors">About</Link>
            <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">Contact</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <Link to="/favorites" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <Heart className="w-5 h-5 text-gray-600" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-fade-in">
                  {favoritesCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-fade-in">
                  {cartCount}
                </span>
              )}
            </Link>
            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-100 animate-slide-in">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-600 hover:text-primary transition-colors">Home</Link>
              <Link to="/shop" className="text-gray-600 hover:text-primary transition-colors">Shop</Link>
              <Link to="/blog" className="text-gray-600 hover:text-primary transition-colors">Blog</Link>
              <Link to="/about" className="text-gray-600 hover:text-primary transition-colors">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
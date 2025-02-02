import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Menu, X, Search } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/lovable-uploads/82389159-6492-4264-a7c0-37e526f8b3a4.png" alt="Kaia Kids" className="h-8" />
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
            <Link to="/favorites" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Heart className="w-5 h-5 text-gray-600" />
            </Link>
            <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
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
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 animate-slide-in">
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
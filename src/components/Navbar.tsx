import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { NavbarIcons } from './navbar/NavbarIcons';
import { NavbarLinks } from './navbar/NavbarLinks';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/90 backdrop-blur-xl z-50 border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <button
            className="md:hidden p-2 -ml-2 flex items-center justify-center hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo — centered on mobile, left on desktop */}
          <Link to="/" className="flex items-center md:order-first absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <span className="font-display text-2xl lg:text-3xl font-light tracking-tight text-ink">
              Kaïa<span className="italic">Kids</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center flex-1 justify-center">
            <NavbarLinks />
          </div>

          <NavbarIcons />
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-background border-b border-border animate-slide-in">
          <div className="container mx-auto px-6 py-6">
            <NavbarLinks className="flex-col items-start gap-5" onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

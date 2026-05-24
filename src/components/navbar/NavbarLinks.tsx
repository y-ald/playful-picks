import { Link, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavbarLinksProps {
  className?: string;
  onNavigate?: () => void;
}

export const NavbarLinks = ({ className = "", onNavigate }: NavbarLinksProps) => {
  const { language, translations, setLanguage } = useLanguage();
  const location = useLocation();

  const toggleLanguage = () => setLanguage(language === 'en' ? 'fr' : 'en');

  const links = [
    { to: `/${language}`, label: translations.navigation?.home || 'Home' },
    { to: `/${language}/shop`, label: translations.navigation?.shop || 'Shop' },
    { to: `/${language}/about`, label: translations.navigation?.about || 'About' },
    { to: `/${language}/contact`, label: translations.navigation?.contact || 'Contact' },
  ];

  return (
    <div className={`flex items-center gap-8 ${className}`}>
      {links.map((link) => {
        const isActive = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={`text-xs tracking-[0.2em] uppercase font-medium transition-colors relative ${
              isActive ? 'text-ink' : 'text-muted-foreground hover:text-ink'
            }`}
          >
            {link.label}
            {isActive && <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-ink" />}
          </Link>
        );
      })}
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 text-xs tracking-[0.2em] uppercase font-medium text-muted-foreground hover:text-ink transition-colors"
      >
        <Globe className="h-3.5 w-3.5" />
        {language === 'en' ? 'FR' : 'EN'}
      </button>
    </div>
  );
};

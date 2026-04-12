import { Link, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface NavbarLinksProps {
  className?: string;
  onNavigate?: () => void;
}

export const NavbarLinks = ({ className = "", onNavigate }: NavbarLinksProps) => {
  const { language, translations, setLanguage } = useLanguage();
  const location = useLocation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <div className={`flex items-center gap-8 ${className}`}>
      <Link to={`/${language}`} className="text-gray-600 hover:text-primary transition-colors" onClick={onNavigate}>
        {translations.navigation?.home || 'Home'}
      </Link>
      <Link to={`/${language}/shop`} className="text-gray-600 hover:text-primary transition-colors" onClick={onNavigate}>
        {translations.navigation?.shop || 'Shop'}
      </Link>
      <Link to={`/${language}/about`} className="text-gray-600 hover:text-primary transition-colors" onClick={onNavigate}>
        {translations.navigation?.about || 'About'}
      </Link>
      <Link to={`/${language}/contact`} className="text-gray-600 hover:text-primary transition-colors" onClick={onNavigate}>
        {translations.navigation?.contact || 'Contact'}
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
        onClick={toggleLanguage}
      >
        <Globe className="h-4 w-4" />
        {language === 'en' ? 'FR' : 'EN'}
      </Button>
    </div>
  );
};

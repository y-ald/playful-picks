import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type Language = 'en' | 'fr';
type Translations = Record<string, any>;

interface LanguageContextType {
  language: Language;
  translations: Translations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    const loadTranslations = async () => {
      const langFromPath = location.pathname.split('/')[1] as Language;
      if (langFromPath && (langFromPath === 'en' || langFromPath === 'fr')) {
        setLanguageState(langFromPath);
      }
      
      try {
        const translations = await import(`../locales/${langFromPath || 'en'}.json`);
        setTranslations(translations.default);
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    };

    loadTranslations();
  }, [location.pathname]);

  const setLanguage = (newLang: Language) => {
    const currentPath = location.pathname;
    const pathParts = currentPath.split('/');
    
    if (pathParts[1] === 'en' || pathParts[1] === 'fr') {
      pathParts[1] = newLang;
    } else {
      pathParts.splice(1, 0, newLang);
    }
    
    navigate(pathParts.join('/'));
    setLanguageState(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, translations, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

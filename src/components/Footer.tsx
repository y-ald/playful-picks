import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';

export const Footer = () => {
  const { lang = 'fr' } = useParams<{ lang: string }>();

  return (
    <footer className="bg-secondary text-secondary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <img 
              src="/lovable-uploads/82389159-6492-4264-a7c0-37e526f8b3a4.png" 
              alt="Kaia Kids" 
              className="h-12 w-auto mb-4"
            />
            <p className="text-muted-foreground max-w-md">
              Des vêtements et accessoires de qualité pour les enfants, 
              conçus avec amour et attention aux détails.
            </p>
          </div>

          {/* Informations légales */}
          <div>
            <h3 className="font-semibold mb-4">Informations</h3>
            <ul className="space-y-2">
              <li>
                <Link to={`/${lang}/terms`} className="text-muted-foreground hover:text-foreground transition-colors">
                  Conditions de vente
                </Link>
              </li>
              <li>
                <Link to={`/${lang}/privacy`} className="text-muted-foreground hover:text-foreground transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to={`/${lang}/legal`} className="text-muted-foreground hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>Email: contact@kaiakids.com</li>
              <li>
                <Link to={`/${lang}/contact`} className="hover:text-foreground transition-colors">
                  Formulaire de contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Kaia Kids. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

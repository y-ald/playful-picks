import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Instagram, Facebook, Mail } from 'lucide-react';

export const Footer = () => {
  const { lang = 'fr' } = useParams<{ lang: string }>();
  const { translations } = useLanguage();
  const t = translations.footer || {};

  return (
    <footer className="bg-ink text-background mt-20">
      {/* Newsletter */}
      <div className="border-b border-background/10">
        <div className="container mx-auto px-6 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-background/60 mb-3">
                Stay in the loop
              </p>
              <h3 className="font-display text-3xl lg:text-5xl font-light text-balance leading-[1.05]">
                Letters from <span className="italic">the studio.</span>
              </h3>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex border-b border-background/30 focus-within:border-background transition-colors"
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent py-4 text-sm placeholder:text-background/40 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 text-xs tracking-[0.25em] uppercase font-medium hover:text-primary transition-colors"
              >
                Subscribe →
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-display text-2xl font-light mb-4">Kaïa Kids</h4>
            <p className="text-sm text-background/60 leading-relaxed max-w-xs">
              {t.description || "Thoughtfully designed essentials for kids, made with care."}
            </p>
          </div>

          <div>
            <h5 className="text-[11px] tracking-[0.3em] uppercase text-background/40 mb-5">Shop</h5>
            <ul className="space-y-3 text-sm">
              <li><Link to={`/${lang}/shop`} className="text-background/80 hover:text-background transition-colors">All products</Link></li>
              <li><Link to={`/${lang}/shop`} className="text-background/80 hover:text-background transition-colors">New arrivals</Link></li>
              <li><Link to={`/${lang}/favorites`} className="text-background/80 hover:text-background transition-colors">Favorites</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[11px] tracking-[0.3em] uppercase text-background/40 mb-5">{t.information || "Information"}</h5>
            <ul className="space-y-3 text-sm">
              <li><Link to={`/${lang}/about`} className="text-background/80 hover:text-background transition-colors">About</Link></li>
              <li><Link to={`/${lang}/contact`} className="text-background/80 hover:text-background transition-colors">{t.contactForm || "Contact"}</Link></li>
              <li><Link to={`/${lang}/terms`} className="text-background/80 hover:text-background transition-colors">{t.terms || "Terms"}</Link></li>
              <li><Link to={`/${lang}/privacy`} className="text-background/80 hover:text-background transition-colors">{t.privacy || "Privacy"}</Link></li>
              <li><Link to={`/${lang}/legal`} className="text-background/80 hover:text-background transition-colors">{t.legal || "Legal"}</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[11px] tracking-[0.3em] uppercase text-background/40 mb-5">Connect</h5>
            <div className="flex gap-3 mb-5">
              <a href="#" aria-label="Instagram" className="w-10 h-10 border border-background/20 hover:border-background hover:bg-background hover:text-ink transition-colors flex items-center justify-center">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Facebook" className="w-10 h-10 border border-background/20 hover:border-background hover:bg-background hover:text-ink transition-colors flex items-center justify-center">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="mailto:contact@kaiakids.com" aria-label="Email" className="w-10 h-10 border border-background/20 hover:border-background hover:bg-background hover:text-ink transition-colors flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </a>
            </div>
            <p className="text-sm text-background/60 break-all">contact@kaiakids.com</p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-background/50">
          <p>&copy; {new Date().getFullYear()} Kaïa Kids. {t.copyright || "All rights reserved."}</p>
          <p className="tracking-wider uppercase">{t.securePayment || "Secure payment"} · {t.fastDelivery || "Fast delivery"}</p>
        </div>
      </div>
    </footer>
  );
};

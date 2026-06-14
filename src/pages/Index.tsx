import Hero from '../components/Hero';
import AgeCategories from '../components/AgeCategories';
import NewArrivals from '../components/NewArrivals';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Truck, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';
import editorialCampaign from '@/assets/editorial-campaign.jpg';

const Index = () => {
  const { language, translations } = useLanguage();
  const e = translations.home?.editorial || {};
  const tr = translations.home?.trust || {};

  const trustItems = [
    { icon: Truck, title: tr.shipping?.title || 'Free shipping', desc: tr.shipping?.desc || 'On orders over $75' },
    { icon: RefreshCw, title: tr.returns?.title || 'Easy returns', desc: tr.returns?.desc || '30 days, no questions' },
    { icon: ShieldCheck, title: tr.secure?.title || 'Secure payment', desc: tr.secure?.desc || 'Encrypted checkout' },
    { icon: Sparkles, title: tr.crafted?.title || 'Crafted with care', desc: tr.crafted?.desc || 'Made for little ones' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Hero />

      <section className="grid lg:grid-cols-2 min-h-[70vh] border-y border-border">
        <div className="relative bg-secondary overflow-hidden order-2 lg:order-1">
          <img
            src={editorialCampaign}
            alt="Atelier de mode enfantine — tissus durables et savoir-faire artisanal"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center px-8 lg:px-20 py-20 bg-paper order-1 lg:order-2">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
            {e.eyebrow || 'The collection'}
          </p>
          <h2 className="font-display text-4xl lg:text-6xl font-light text-ink leading-[1] mb-8 text-balance">
            {e.title1 || 'Soft hues.'}<br/>
            <span className="italic">{e.title2 || 'Strong souls.'}</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-md leading-relaxed mb-8">
            {e.description || 'Pieces designed in our Paris studio — refined silhouettes, gentle palettes, and fabrics chosen for tiny adventurers.'}
          </p>
          <Link
            to={`/${language}/shop`}
            className="self-start inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase font-medium text-ink border-b border-ink pb-1 hover:text-primary hover:border-primary transition-colors"
          >
            {e.cta || 'Discover'} →
          </Link>
        </div>
      </section>

      <AgeCategories />

      <section className="bg-secondary-light py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <NewArrivals />
        </div>
      </section>

      <section className="bg-background border-t border-border">
        <div className="container mx-auto px-6 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trustItems.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-primary mt-1 shrink-0" strokeWidth={1.5} />
                <div>
                  <h3 className="text-sm font-medium text-ink mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

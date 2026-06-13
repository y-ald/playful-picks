import Hero from '../components/Hero';
import AgeCategories from '../components/AgeCategories';
import NewArrivals from '../components/NewArrivals';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Truck, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';
import editorialCampaign from '@/assets/editorial-campaign.jpg';

const Index = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Hero />

      {/* Editorial split — campaign */}
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
            The collection
          </p>
          <h2 className="font-display text-4xl lg:text-6xl font-light text-ink leading-[1] mb-8 text-balance">
            Soft hues.<br/>
            <span className="italic">Strong souls.</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-md leading-relaxed mb-8">
            Pieces designed in our Paris studio — refined silhouettes, gentle palettes, and fabrics chosen for tiny adventurers.
          </p>
          <Link
            to={`/${language}/shop`}
            className="self-start inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase font-medium text-ink border-b border-ink pb-1 hover:text-primary hover:border-primary transition-colors"
          >
            Discover →
          </Link>
        </div>
      </section>

      <AgeCategories />

      {/* New arrivals */}
      <section className="bg-secondary-light py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <NewArrivals />
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-background border-t border-border">
        <div className="container mx-auto px-6 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: 'Free shipping', desc: 'On orders over $75' },
              { icon: RefreshCw, title: 'Easy returns', desc: '30 days, no questions' },
              { icon: ShieldCheck, title: 'Secure payment', desc: 'Encrypted checkout' },
              { icon: Sparkles, title: 'Crafted with care', desc: 'Made for little ones' },
            ].map(({ icon: Icon, title, desc }) => (
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

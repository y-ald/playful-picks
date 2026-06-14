import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import heroImage from '@/assets/hero-kids.jpg';

const Hero = () => {
  const { language, translations } = useLanguage();
  const t = translations.home?.hero || {};
  const a = translations.home?.announcement || {};

  const marquee = [
    a.shipping || 'Free shipping over $75',
    a.collection || 'New collection — Spring 26',
    a.crafted || 'Crafted for little ones',
  ];

  return (
    <section className="relative w-full bg-secondary-light">
      {/* Announcement bar */}
      <div className="bg-ink text-background text-xs tracking-[0.2em] uppercase py-2.5 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-6 shrink-0">
              {[...marquee, ...marquee].map((text, j) => (
                <span key={j} className="flex items-center gap-12">
                  {text}
                  <span>•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 min-h-[88vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-7 relative bg-primary-light overflow-hidden"
        >
          <img
            src={heroImage}
            alt="Kaïa Kids Spring collection"
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute top-6 left-6 bg-background/95 backdrop-blur px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase font-medium">
            {t.badge || 'Spring · 26'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="lg:col-span-5 flex flex-col justify-center px-8 lg:px-16 py-16 lg:py-24 bg-background"
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-6">
            {t.newArrivals || 'New arrivals'}
          </p>
          <h1 className="font-display text-5xl lg:text-7xl font-light leading-[0.95] text-ink mb-8 text-balance">
            {t.title || 'Dressed for play.'}
          </h1>
          <p className="text-base lg:text-lg text-muted-foreground max-w-md leading-relaxed mb-10">
            {t.description || 'Thoughtfully designed essentials for kids who run, dream, and grow into themselves.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/${language}/shop`}
              className="group inline-flex items-center justify-center gap-2 bg-ink text-background px-8 py-4 text-sm tracking-wider uppercase font-medium hover:bg-primary transition-colors"
            >
              {t.shopButton || 'Shop collection'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={`/${language}/about`}
              className="inline-flex items-center justify-center gap-2 border border-ink text-ink px-8 py-4 text-sm tracking-wider uppercase font-medium hover:bg-ink hover:text-background transition-colors"
            >
              {t.ourStory || 'Our story'}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

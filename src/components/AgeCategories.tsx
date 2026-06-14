import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import babyImg from '@/assets/age-baby.jpg';
import toddlerImg from '@/assets/age-toddler.jpg';
import kidsImg from '@/assets/age-kids.jpg';
import preteenImg from '@/assets/age-preteen.jpg';

const AgeCategories = () => {
  const { language, translations } = useLanguage();
  const t = translations.home?.ageCategories || {};

  const categories = [
    { age: '0-2', label: t.infant || 'Baby', illustration: babyImg },
    { age: '3-5', label: t.toddler || 'Toddler', illustration: toddlerImg },
    { age: '6-8', label: t.kids || 'Kids', illustration: kidsImg },
    { age: '9-12', label: t.preteen || 'Pre-teens', illustration: preteenImg },
  ];

  return (
    <section className="w-full bg-background py-20 lg:py-28">
      <div className="container mx-auto px-6">
        <div className="flex items-end justify-between mb-12 lg:mb-16 gap-6">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
              {t.eyebrow || 'By age'}
            </p>
            <h2 className="font-display text-3xl lg:text-5xl font-light text-ink text-balance">
              {t.title || 'Find their fit.'}
            </h2>
          </div>
          <Link
            to={`/${language}/shop`}
            className="hidden md:inline-flex items-center text-sm tracking-wider uppercase font-medium text-ink border-b border-ink pb-1 hover:text-primary hover:border-primary transition-colors"
          >
            {t.viewAll || 'View all'}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {categories.map((category, index) => (
            <motion.div
              key={category.age}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Link
                to={`/${language}/shop?age=${encodeURIComponent(category.age)}`}
                className="group block"
              >
                <div className="relative overflow-hidden bg-secondary aspect-[3/4] mb-4">
                  <img
                    src={category.illustration}
                    alt={`${category.label}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
                  <span className="absolute bottom-4 left-4 font-display text-2xl lg:text-3xl text-background font-light">
                    {category.age}
                  </span>
                </div>
                <h3 className="text-sm tracking-wider uppercase font-medium text-ink group-hover:text-primary transition-colors">
                  {category.label}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgeCategories;

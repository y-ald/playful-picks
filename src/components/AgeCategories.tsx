import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const AgeCategories = () => {
  const { translations } = useLanguage();
  const t = translations.home?.ageCategories || {};

  const categories = [
    { 
      age: '0-2',
      label: t.infant,
      illustration: '/lovable-uploads/82389159-6492-4264-a7c0-37e526f8b3a4.png'
    },
    { 
      age: '3-5',
      label: t.toddler,
      illustration: '/lovable-uploads/922c1565-0314-4b1b-98e7-4c7d7a672bd9.png'
    },
    { 
      age: '6-8',
      label: t.kids,
      illustration: '/lovable-uploads/82389159-6492-4264-a7c0-37e526f8b3a4.png'
    },
    { 
      age: '9-12',
      label: t.preteen,
      illustration: '/lovable-uploads/922c1565-0314-4b1b-98e7-4c7d7a672bd9.png'
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.age}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg bg-accent-light aspect-square transition-transform duration-300 group-hover:scale-95">
                <img 
                  src={category.illustration} 
                  alt={`${category.label} category`}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-4">
                  <span className="text-4xl font-bold text-white mb-2">{category.age}</span>
                  <h3 className="text-xl font-medium text-white">{category.label}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgeCategories;

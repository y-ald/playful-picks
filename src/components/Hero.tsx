
import { motion } from 'framer-motion';
import { ArrowRight, Star, Gift, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Hero = () => {
  const { language, translations } = useLanguage();
  const t = translations.home?.hero || {};
  const features = translations.home?.features || {};

  return (
    <div className="relative min-h-screen bg-secondary-light overflow-hidden">
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Main Hero Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <span className="inline-block px-4 py-2 bg-primary-light text-primary rounded-full text-sm font-medium">
              {t.badge}
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              {t.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              {t.description}
            </p>
            <div className="flex gap-4">
              <Link 
                to={`/${language}/shop`} 
                className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors"
              >
                {t.shopButton}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <img 
              src="/lovable-uploads/5040cbab-aa9f-43cc-a614-65aa0be6a03d.png"
              alt="Kaïa Kids Collection"
              className="w-full h-auto rounded-2xl shadow-xl"
            />
            <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm font-medium mt-1">{t.reviewsTitle}</p>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-8"
        >
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{features.quality?.title}</h3>
            <p className="text-gray-600">{features.quality?.description}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{features.fit?.title}</h3>
            <p className="text-gray-600">{features.fit?.description}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{features.delivery?.title}</h3>
            <p className="text-gray-600">{features.delivery?.description}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;

import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center bg-secondary-light overflow-hidden">
      <div className="container mx-auto px-4 pt-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <span className="inline-block px-4 py-2 bg-primary-light text-primary rounded-full text-sm font-medium">
              New Store Opening
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              Discover Joy in Every Toy
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              Curated collection of premium toys and accessories for your little ones.
            </p>
            <button className="px-8 py-4 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors">
              Shop Now
            </button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <img 
              src="/lovable-uploads/922c1565-0314-4b1b-98e7-4c7d7a672bd9.png"
              alt="Featured Product"
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
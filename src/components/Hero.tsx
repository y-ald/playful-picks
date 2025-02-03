import { motion } from 'framer-motion';
import { ArrowRight, Star, Gift, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
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
              Special Launch Offer - 20% Off
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Where Learning Meets Fun
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              Discover our carefully curated collection of educational toys that spark creativity, 
              encourage learning, and bring joy to every child's development journey.
            </p>
            <div className="flex gap-4">
              <Link to="/shop" className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/about" className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors">
                Learn More
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
              src="/lovable-uploads/922c1565-0314-4b1b-98e7-4c7d7a672bd9.png"
              alt="Featured Product"
              className="w-full h-auto rounded-2xl shadow-xl"
            />
            <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm font-medium mt-1">Trusted by 10,000+ Parents</p>
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
            <h3 className="text-xl font-semibold mb-2">Quality Assured</h3>
            <p className="text-gray-600">Every toy is carefully selected to meet the highest safety and quality standards.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Educational Value</h3>
            <p className="text-gray-600">Toys that combine fun with learning, supporting your child's development.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Free shipping on orders over $50 with our express delivery service.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;

import { motion } from 'framer-motion';
import { ArrowRight, Star, Gift, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
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
              Spring Collection - 20% Off Kids Fashion
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Dress Your Little Ones in Style
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              Discover our delightful collection of children's clothing that combines 
              comfort, style, and durability. From playful patterns to practical designs, 
              we've got everything your kids need.
            </p>
            <div className="flex gap-4">
              <Link to="/shop" className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors">
                Shop Collection
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
              src="/lovable-uploads/f90e85a7-0633-42ef-90c8-083081a2251d.png"
              alt="Kaïa Kids Collection"
              className="w-full h-auto rounded-2xl shadow-xl object-cover"
            />
            <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm font-medium mt-1">Loved by Parents & Kids</p>
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
            <h3 className="text-xl font-semibold mb-2">Quality Materials</h3>
            <p className="text-gray-600">Soft, durable fabrics that keep your children comfortable all day long.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Perfect Fit</h3>
            <p className="text-gray-600">Carefully designed sizes to grow with your child, ensuring comfort and style.</p>
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

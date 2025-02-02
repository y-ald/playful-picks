import { motion } from 'framer-motion';

const categories = [
  { age: '0-2', label: 'Infants' },
  { age: '3-5', label: 'Toddlers' },
  { age: '6-8', label: 'Kids' },
  { age: '9-12', label: 'Pre-teens' },
];

const AgeCategories = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Shop by Age</h2>
          <p className="text-gray-600">Find the perfect toys for your child's age group</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.age}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg bg-accent-light aspect-square flex items-center justify-center transition-transform group-hover:scale-95">
                <span className="text-4xl font-bold text-accent">{category.age}</span>
              </div>
              <h3 className="mt-4 text-center text-lg font-medium">{category.label}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgeCategories;
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';
import ProductCard from './ProductCard';
import { supabase } from '@/integrations/supabase/client';

const NewArrivals = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: products, isLoading } = useQuery({
    queryKey: ['newArrivals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });

    // Update scroll buttons visibility after animation
    setTimeout(() => {
      if (!container) return;
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < (container.scrollWidth - container.clientWidth));
    }, 300);
  };

  if (isLoading) {
    return <div className="animate-pulse h-[400px] bg-gray-100 rounded-lg"></div>;
  }

  if (!products?.length) {
    return null;
  }

  return (
    <div className="relative group">
      {canScrollLeft && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
      )}
      
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-6 pb-4">
          {products.map((product) => (
            <div key={product.id} className="min-w-[280px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {canScrollRight && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
};

export default NewArrivals;

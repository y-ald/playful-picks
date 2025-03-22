
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import ProductCard from './ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const NewArrivals = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { language, translations } = useLanguage();

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

  if (isLoading) {
    return <div className="animate-pulse h-[400px] bg-gray-100 rounded-lg"></div>;
  }

  if (!products?.length) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {translations?.home?.newArrivals?.title || "New Arrivals"}
        </h2>
        <a 
          href={`/${language}/shop`} 
          className="text-primary hover:underline"
        >
          {translations?.home?.newArrivals?.viewAll || "View All"}
        </a>
      </div>
      
      <Carousel
        className="w-full"
        opts={{
          align: "start",
          dragFree: true,
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {products.map((product) => (
            <CarouselItem 
              key={product.id} 
              className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default NewArrivals;

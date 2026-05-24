import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const NewArrivals = () => {
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
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!products?.length) return null;

  return (
    <div>
      <div className="flex items-end justify-between mb-12 gap-6">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
            Just landed
          </p>
          <h2 className="font-display text-3xl lg:text-5xl font-light text-ink text-balance">
            {translations?.home?.newArrivals?.title || "New arrivals"}
          </h2>
        </div>
        <Link
          to={`/${language}/shop`}
          className="hidden md:inline-flex items-center text-sm tracking-wider uppercase font-medium text-ink border-b border-ink pb-1 hover:text-primary hover:border-primary transition-colors"
        >
          {translations?.home?.newArrivals?.viewAll || "View all"}
        </Link>
      </div>

      <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
        <CarouselContent className="-ml-3 lg:-ml-5">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="pl-3 lg:pl-5 basis-1/2 md:basis-1/3 lg:basis-1/4"
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

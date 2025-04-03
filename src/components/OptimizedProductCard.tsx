
import { memo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavoritesStorage } from '@/hooks/useFavoritesStorage';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useStableCallback } from '@/hooks/useOptimizedRender';

interface Product {
  id: string;
  name: string;
  price: number;
  promotion_price?: number | null;
  image_url: string | null;
  additional_images?: string[];
  description: string | null;
}

interface ProductCardProps {
  product: Product;
}

// Using React.memo to prevent unnecessary re-renders
const OptimizedProductCard = memo(({ product }: ProductCardProps) => {
  const { toast } = useToast();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavoritesStorage();
  const { addToCart } = useCart();
  const { language, translations } = useLanguage();
  const [autoplayInterval, setAutoplayInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Use ref to prevent stale closures in interval callback
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;

  // Prepare images array for carousel
  const images = [
    product.image_url,
    ...(product.additional_images || [])
  ].filter(Boolean) as string[];

  // Set up autoplay for image carousel with cleanup
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % images.length);
      }, 3000); // Change image every 3 seconds
      
      setAutoplayInterval(interval);
    }
    
    return () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    };
  }, [images.length]);

  // Stable callback functions with useCallback
  const handleFavoriteClick = useStableCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (isFavorite(product.id)) {
        await removeFromFavorites(product.id);
        toast({
          title: translations?.shop?.removeFavorite || "Removed from favorites",
          description: `${product.name} has been removed from your favorites`
        });
      } else {
        await addToFavorites(product.id);
        toast({
          title: translations?.shop?.addToFavorites || "Added to favorites",
          description: `${product.name} has been added to your favorites`
        });
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
      });
    }
  }, [product.id, product.name, isFavorite, removeFromFavorites, addToFavorites, toast, translations?.shop?.removeFavorite, translations?.shop?.addToFavorites]);

  const handleAddToCart = useStableCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(product.id);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  }, [product.id, product.name, addToCart, toast]);

  return (
    <div className="group">
      <Link to={`/${language}/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
          {images.length > 1 ? (
            <Carousel className="w-full h-full" selectedIndex={currentSlide}>
              <CarouselContent className="h-full">
                {images.map((src, index) => (
                  <CarouselItem key={index} className="h-full">
                    <img
                      src={src}
                      alt={`${product.name} - image ${index + 1}`}
                      className="h-full w-full object-cover object-center"
                      loading="lazy" // Add lazy loading
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              loading="lazy" // Add lazy loading
            />
          )}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
            aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 h-14">
          {product.name}
        </h3>
        <div className="mb-4">
          {product.promotion_price ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 line-through">${product.price.toFixed(2)}</span>
              <span className="text-[#ea384c] font-bold">${product.promotion_price.toFixed(2)}</span>
            </div>
          ) : (
            <p className="text-primary font-bold">
              ${product.price.toFixed(2)}
            </p>
          )}
        </div>
      </Link>
      <Button 
        onClick={handleAddToCart}
        className="w-full bg-primary hover:bg-primary-hover text-white"
      >
        {translations?.shop?.addToCart || "Add to Cart"}
      </Button>
    </div>
  );
});

// Setting a display name for better debugging
OptimizedProductCard.displayName = 'OptimizedProductCard';

export default OptimizedProductCard;

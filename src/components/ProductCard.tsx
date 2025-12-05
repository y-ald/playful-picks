import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useState, memo, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigation } from "@/contexts/NavigationContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { AspectRatio } from "./ui/aspect-ratio";

interface Product {
  id: string;
  name: string;
  price: number;
  promotion_price?: number | null;
  image_url: string | null;
  additional_images?: string[];
  description: string | null;
  stock_quantity?: number | null;
}

interface ProductCardProps {
  product: Product;
}

// Using memo to prevent unnecessary re-renders
const ProductCard = memo(({ product }: ProductCardProps) => {
  const { toast } = useToast();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const { language, translations } = useLanguage();
  const [autoplayInterval, setAutoplayInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Prepare images array for carousel
  const images = [
    product.image_url,
    ...(product.additional_images || []),
  ].filter(Boolean) as string[];

  // Use Intersection Observer to detect when card is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Set up autoplay for image carousel only when visible
  useEffect(() => {
    if (isVisible && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % images.length);
      }, 3000); // Change image every 3 seconds

      setAutoplayInterval(interval);
    }

    return () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    };
  }, [images.length, isVisible]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (isFavorite(product.id)) {
        removeFromFavorites(product.id);
      } else {
        addToFavorites(product.id);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(product.id);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="group" ref={cardRef}>
      <Link to={`/${language}/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg bg-gray-100 mb-4">
          <AspectRatio ratio={1 / 1}>
            {isVisible ? (
              images.length > 1 ? (
                <Carousel
                  className="w-full h-full"
                  selectedIndex={currentSlide}
                >
                  <CarouselContent className="h-full">
                    {images.map((src, index) => (
                      <CarouselItem key={index} className="h-full">
                        <div className="h-full w-full flex items-center justify-center">
                          <img
                            src={src}
                            alt={`${product.name} - image ${index + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )
            ) : (
              // Skeleton loading state
              <div className="h-full w-full bg-gray-200 animate-pulse"></div>
            )}
          </AspectRatio>
          <button
            onClick={handleFavoriteClick}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
            aria-label={
              isFavorite(product.id)
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite(product.id)
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600"
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
              <span className="text-gray-500 line-through">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-[#ea384c] font-bold">
                ${product.promotion_price.toFixed(2)}
              </span>
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
        disabled={product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 0}
      >
        {product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 0 
          ? (translations?.shop?.outOfStock || "Out of Stock")
          : (translations?.shop?.addToCart || "Add to Cart")}
      </Button>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;

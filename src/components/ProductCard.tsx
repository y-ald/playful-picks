import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useToast } from "./ui/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useState, memo, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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

const ProductCard = memo(({ product }: ProductCardProps) => {
  const { toast } = useToast();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const { language, translations } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const images = [product.image_url, ...(product.additional_images || [])].filter(Boolean) as string[];
  const secondaryImage = images[1] || images[0];

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
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const outOfStock =
    product.stock_quantity !== null &&
    product.stock_quantity !== undefined &&
    product.stock_quantity <= 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isFavorite(product.id)) removeFromFavorites(product.id);
      else addToFavorites(product.id);
    } catch {
      toast({ title: "Error", description: "Failed to update favorites", variant: "destructive" });
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    try {
      await addToCart(product.id);
      toast({ title: "Added to bag", description: product.name });
    } catch {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  return (
    <div
      ref={cardRef}
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/${language}/product/${product.id}`} className="block">
        <div className="relative overflow-hidden bg-secondary-light mb-4">
          <AspectRatio ratio={3 / 4}>
            {isVisible ? (
              <>
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className={`h-full w-full object-cover transition-opacity duration-500 ${hovered && images.length > 1 ? "opacity-0" : "opacity-100"}`}
                  loading="lazy"
                />
                {images.length > 1 && (
                  <img
                    src={secondaryImage}
                    alt={`${product.name} alternate view`}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
                    loading="lazy"
                  />
                )}
              </>
            ) : (
              <div className="h-full w-full bg-muted animate-pulse" />
            )}
          </AspectRatio>

          {/* Tags */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.promotion_price && (
              <span className="bg-ink text-background text-[10px] tracking-[0.15em] uppercase font-medium px-2.5 py-1">
                Sale
              </span>
            )}
            {outOfStock && (
              <span className="bg-background text-ink text-[10px] tracking-[0.15em] uppercase font-medium px-2.5 py-1 border border-ink">
                Sold out
              </span>
            )}
          </div>

          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 bg-background/90 backdrop-blur hover:bg-background transition-colors"
            aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`w-4 h-4 ${isFavorite(product.id) ? "fill-primary text-primary" : "text-ink"}`} />
          </button>

          {/* Quick add (desktop) */}
          {!outOfStock && (
            <button
              onClick={handleAddToCart}
              className="hidden md:block absolute bottom-0 left-0 right-0 bg-ink text-background text-xs tracking-[0.2em] uppercase font-medium py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            >
              {translations?.shop?.addToCart || "Add to bag"}
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-sm font-medium text-ink line-clamp-1">
            {product.name}
          </h3>
          <div className="text-sm">
            {product.promotion_price ? (
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                <span className="text-destructive font-medium">${product.promotion_price.toFixed(2)}</span>
              </span>
            ) : (
              <span className="text-ink">${product.price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Mobile add button */}
      <button
        onClick={handleAddToCart}
        disabled={outOfStock}
        className="md:hidden w-full mt-3 border border-ink text-ink text-xs tracking-[0.2em] uppercase font-medium py-2.5 disabled:opacity-40"
      >
        {outOfStock ? (translations?.shop?.outOfStock || "Sold out") : (translations?.shop?.addToCart || "Add to bag")}
      </button>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;

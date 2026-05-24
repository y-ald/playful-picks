import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight, Truck, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { useProductData } from "@/hooks/useDataFetching";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, translations } = useLanguage();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: product, isLoading, error } = useProductData(id ?? "");

  const images = product
    ? [product.image_url, ...(product.additional_images || [])].filter(Boolean)
    : [];

  useEffect(() => setCurrentImageIndex(0), [id]);

  if (!id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-3xl font-light text-ink mb-3">Invalid product</h2>
          <Button onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product?.stock_quantity !== null && product?.stock_quantity !== undefined && product.stock_quantity <= 0;

  const addToCartHandler = async () => {
    if (isOutOfStock) return;
    try {
      await addToCart(id);
      toast({ title: "Added to bag", description: product?.name });
    } catch {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite(id)) await removeFromFavorites(id);
      else await addToFavorites(id);
    } catch {
      toast({ title: "Error", description: "Failed to update favorites", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="grid lg:grid-cols-2 gap-0">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="px-8 lg:px-16 py-16 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-3xl font-light text-ink mb-3">Product not found</h2>
          <Button onClick={() => window.history.back()}>Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Breadcrumb */}
      <div className="container mx-auto px-6 py-4">
        <div className="text-xs tracking-wider uppercase text-muted-foreground flex gap-2">
          <Link to={`/${language}`} className="hover:text-ink">Home</Link>
          <span>/</span>
          <Link to={`/${language}/shop`} className="hover:text-ink">Shop</Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-0 lg:min-h-[80vh]">
        {/* Gallery */}
        <div className="bg-secondary-light">
          <div className="relative aspect-[3/4] lg:aspect-auto lg:h-full">
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur hover:bg-background"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur hover:bg-background"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-1 transition-all ${currentImageIndex === i ? "w-8 bg-ink" : "w-4 bg-ink/30"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center bg-background">
          <div className="w-full px-8 lg:px-16 py-12 lg:py-20 space-y-8 max-w-xl">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
                Kaïa Kids
              </p>
              <h1 className="font-display text-3xl lg:text-5xl font-light text-ink leading-tight mb-4 text-balance">
                {product.name}
              </h1>
              <div className="text-xl text-ink">
                {product.promotion_price ? (
                  <span className="flex items-center gap-3">
                    <span className="line-through text-muted-foreground">${product.price.toFixed(2)}</span>
                    <span className="text-destructive font-medium">${product.promotion_price.toFixed(2)}</span>
                  </span>
                ) : (
                  <span>${product.price.toFixed(2)}</span>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {product.age_range && (
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Recommended age</p>
                <p className="text-sm text-ink">{product.age_range} years</p>
              </div>
            )}

            {product.description && (
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            {isOutOfStock && (
              <p className="text-sm text-destructive uppercase tracking-wider">Currently sold out</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={addToCartHandler}
                disabled={isOutOfStock}
                className="flex-1 h-14 bg-ink text-background hover:bg-primary rounded-none text-xs tracking-[0.25em] uppercase font-medium"
              >
                {isOutOfStock ? "Sold out" : (translations?.shop?.addToCart || "Add to bag")}
              </Button>
              <Button
                variant="outline"
                onClick={toggleFavorite}
                className="h-14 w-14 rounded-none border-ink hover:bg-ink hover:text-background"
              >
                <Heart className={`h-4 w-4 ${isFavorite(id) ? "fill-primary text-primary" : ""}`} />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-6 border-t border-border">
              {[
                { icon: Truck, label: 'Free shipping over $75' },
                { icon: RefreshCw, label: 'Free returns within 30 days' },
                { icon: ShieldCheck, label: 'Secure encrypted payment' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

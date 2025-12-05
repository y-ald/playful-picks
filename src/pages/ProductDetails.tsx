import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { useProductData } from "@/hooks/useDataFetching";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { language, translations } = useLanguage();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch product data using our optimized hook
  const { data: product, isLoading, error } = useProductData(id);

  // Prepare all product images
  const images = product
    ? [product.image_url, ...(product.additional_images || [])].filter(Boolean)
    : [];

  // Reset current image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const isOutOfStock = product?.stock_quantity !== null && product?.stock_quantity !== undefined && product.stock_quantity <= 0;

  const addToCartHandler = async () => {
    if (isOutOfStock) {
      toast({
        title: "Out of Stock",
        description: "This product is currently unavailable",
        variant: "destructive",
      });
      return;
    }
    try {
      await addToCart(id);
      toast({
        title: "Success",
        description: "Item added to cart",
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

  const toggleFavorite = async () => {
    try {
      if (isFavorite(id)) {
        await removeFromFavorites(id);
      } else {
        await addToFavorites(id);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="flex-shrink-0 w-20 h-20 rounded-md"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative aspect-square">
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                    currentImageIndex === index
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <p className="text-2xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </p>
            {product.age_range && (
              <p className="text-gray-600">Age: {product.age_range}</p>
            )}
            <p className="text-gray-700">{product.description}</p>
            {isOutOfStock && (
              <p className="text-destructive font-medium">Out of Stock</p>
            )}
            <div className="flex gap-4">
              <Button 
                onClick={addToCartHandler} 
                className="flex-1"
                disabled={isOutOfStock}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isOutOfStock ? "Out of Stock" : (translations?.shop?.addToCart || "Add to Cart")}
              </Button>
              <Button variant="outline" onClick={toggleFavorite}>
                <Heart
                  className={`h-4 w-4 ${
                    isFavorite(id) ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

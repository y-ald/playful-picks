import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "./ui/button";
import { useToast } from "@/components/ui/use-toast";
import OptimizedProductCard from "./OptimizedProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  promotion_price?: number | null;
  image_url: string | null;
  additional_images?: string[];
  description?: string | null;
}

interface FavoriteProductCardProps {
  product: Product;
}

// Using React.memo to prevent unnecessary re-renders
const FavoriteProductCard = memo(({ product }: FavoriteProductCardProps) => {
  const { toast } = useToast();
  const { removeFromFavorites } = useFavorites();

  // Stable callback function with useCallback
  const handleRemoveFavorite = useCallback(() => {
    try {
      removeFromFavorites(product.id);
      toast({
        title: "Removed from favorites",
        description: `${product.name} has been removed from your favorites`,
      });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  }, [product.id, product.name, removeFromFavorites, toast]);

  return (
    <div className="space-y-3">
      <OptimizedProductCard product={product} />
      <Button
        variant="outline"
        className="w-full flex items-center justify-center text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 mt-2"
        onClick={handleRemoveFavorite}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Remove from Favorites
      </Button>
    </div>
  );
});

// Setting a display name for better debugging
FavoriteProductCard.displayName = "FavoriteProductCard";

export default FavoriteProductCard;

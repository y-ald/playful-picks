import { lazy, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

// Lazy load the FavoriteProductCard component
const FavoriteProductCard = lazy(
  () => import("@/components/FavoriteProductCard")
);

const Favorites = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { favorites, isLoading } = useFavorites();

  const handleReturnToShop = () => {
    navigate(`/${language}/shop`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="flex items-center mb-6">
            <Skeleton className="h-10 w-32 mr-4" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={handleReturnToShop}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Shop
          </Button>
          <h1 className="text-3xl font-bold">My Favorites</h1>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 mb-4">
              You don't have any favorites yet
            </p>
            <Button onClick={handleReturnToShop}>Browse Products</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <Suspense
                key={favorite.id}
                fallback={
                  <div className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                }
              >
                <FavoriteProductCard product={favorite.product} />
              </Suspense>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

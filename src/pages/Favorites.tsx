import { useQuery } from '@tanstack/react-query';
import { Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { useFavoritesStorage } from '@/hooks/useFavoritesStorage';
import { useCart } from '@/hooks/useCart';

const Favorites = () => {
  const { toast } = useToast();
  const { favoritesId, isFavorite, removeFromFavorites } = useFavoritesStorage();
  const { addToCart } = useCart();

  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!favoritesId) return [];

      if (favoritesId.includes(',')) {
        const productIds = favoritesId.split(',');
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', favoritesId);

        if (error) throw error;
        return data;
      }
    },
    enabled: !!favoritesId,
  });

  const removeFavorite = async (productId: string) => {
    try {
      await removeFromFavorites(productId);
      toast({
        title: "Success",
        description: "Item removed from favorites"
      });
      refetch();
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-3xl font-bold mb-8">My Favorites</h1>
        {favorites?.length === 0 ? (
          <p>No favorites yet</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites?.map((favorite: any) => (
              <div key={favorite.id} className="border rounded-lg p-4">
                <img
                  src={favorite.image_url || '/placeholder.svg'}
                  alt={favorite.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-lg mb-2">
                  {favorite.name}
                </h3>
                <p className="text-primary font-bold mb-4">
                  ${favorite.price.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => addToCart(favorite.id)}
                    className="flex-1"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => removeFavorite(favorite.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

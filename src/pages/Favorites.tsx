import { useQuery } from '@tanstack/react-query';
import { Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';

const Favorites = () => {
  const { toast } = useToast();

  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          product:products (
            id,
            name,
            price,
            image_url,
            description
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
  });

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

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

  const addToCart = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cart_items')
        .insert([
          { user_id: user.id, product_id: productId, quantity: 1 }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item added to cart"
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add to cart",
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
            {favorites?.map((favorite) => (
              <div key={favorite.id} className="border rounded-lg p-4">
                <img
                  src={favorite.product.image_url || '/placeholder.svg'}
                  alt={favorite.product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-lg mb-2">
                  {favorite.product.name}
                </h3>
                <p className="text-primary font-bold mb-4">
                  ${favorite.product.price.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => addToCart(favorite.product.id)}
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

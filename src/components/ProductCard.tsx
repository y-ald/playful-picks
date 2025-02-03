import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCartStorage } from '@/hooks/useCartStorage';

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    category: string | null;
    age_range: string | null;
  };
};

const ProductCard = ({ product }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();
  const { getOrCreateCartId } = useCartStorage();

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to add favorites",
          variant: "destructive"
        });
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;
        setIsFavorite(false);
        toast({
          title: "Success",
          description: "Removed from favorites"
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, product_id: product.id }
          ]);

        if (error) throw error;
        setIsFavorite(true);
        toast({
          title: "Success",
          description: "Added to favorites"
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
      });
    }
  };

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const cartId = await getOrCreateCartId();
      if (!cartId) {
        toast({
          title: "Error",
          description: "Failed to create cart",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .insert([
          { product_id: product.id, quantity: 1 }
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
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="group overflow-hidden">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square relative overflow-hidden">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="object-cover w-full h-full transition-transform group-hover:scale-105"
          />
          <button
            className={`absolute top-2 right-2 p-2 rounded-full ${
              isFavorite ? 'bg-primary text-white' : 'bg-white/80 hover:bg-white'
            } transition-colors`}
            onClick={toggleFavorite}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          {product.age_range && (
            <span className="text-sm text-gray-500">
              Age: {product.age_range}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={addToCart}>
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
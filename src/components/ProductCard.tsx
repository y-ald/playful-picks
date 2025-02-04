import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { toast } = useToast();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const isProductFavorite = isFavorite(product.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the heart
    try {
      if (isProductFavorite) {
        await removeFromFavorites(product.id);
        toast({
          title: "Removed from favorites",
          description: `${product.name} has been removed from your favorites`
        });
      } else {
        await addToFavorites(product.id);
        toast({
          title: "Added to favorites",
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
  };

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${
              isProductFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
          />
        </button>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
      <p className="text-primary font-bold">${product.price.toFixed(2)}</p>
    </Link>
  );
};

export default ProductCard;
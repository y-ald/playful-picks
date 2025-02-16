import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { addToCart } = useCart();
  const { translations } = useLanguage();
  const t = translations.shop || {};
  const isProductFavorite = isFavorite(product.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (isProductFavorite) {
        await removeFromFavorites(product.id);
        toast({
          title: t.removeFavorite,
          description: `${product.name} ${t.hasBeenRemovedFromFavorites}`
        });
      } else {
        await addToFavorites(product.id);
        toast({
          title: t.addToFavorites,
          description: `${product.name} ${t.hasBeenAddedToFavorites}`
        });
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast({
        title: "Error",
        description: t.failedToUpdateFavorites,
        variant: "destructive"
      });
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(product.id);
      toast({
        title: t.addToCart,
        description: `${product.name} ${t.hasBeenAddedToCart}`
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: t.failedToAddItemToCart,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="group">
      <Link to={`/product/${product.id}`} className="block">
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
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 h-14">
          {product.name}
        </h3>
        <p className="text-primary font-bold mb-4">${product.price.toFixed(2)}</p>
      </Link>
      <Button 
        onClick={handleAddToCart}
        className="w-full bg-primary hover:bg-primary-hover text-white"
      >
        {t.addToCart}
      </Button>
    </div>
  );
};

export default ProductCard;

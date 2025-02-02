import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';

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
  return (
    <Card className="group overflow-hidden">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square relative overflow-hidden">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="object-cover w-full h-full transition-transform group-hover:scale-105"
          />
          <button className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors">
            <Heart className="w-5 h-5 text-gray-600" />
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
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
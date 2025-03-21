
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
  age_range: string | null;
  stock_quantity: number;
};

interface ProductListRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export function ProductListRow({ product, onEdit, onDelete }: ProductListRowProps) {
  return (
    <TableRow>
      <TableCell>
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="h-12 w-12 object-contain"
          />
        ) : (
          <div className="h-12 w-12 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
            No Image
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="font-medium">{product.name}</div>
      </TableCell>
      <TableCell>{product.category || '-'}</TableCell>
      <TableCell>{product.age_range || '-'}</TableCell>
      <TableCell>${product.price.toFixed(2)}</TableCell>
      <TableCell>{product.stock_quantity}</TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(product)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive" 
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

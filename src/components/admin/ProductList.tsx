
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Edit, Trash2 } from 'lucide-react';
import { ProductEditModal } from './ProductEditModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('products')
        .select('*');
        
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        throw error;
      }
      
      setProducts(data as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]); // Reload when search query changes

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Product Deleted",
        description: "The product has been removed from inventory",
      });
      
      // Refresh product list
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleProductUpdated = () => {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search products..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Age Range</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
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
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive" 
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {selectedProduct && (
        <ProductEditModal
          product={selectedProduct}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProductUpdated}
        />
      )}
    </div>
  );
}


import { useState, lazy, Suspense } from 'react';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

// Lazy load components
const ProductCard = lazy(() => import('@/components/ProductCard'));
const OptimizedProductCard = lazy(() => import('@/components/OptimizedProductCard'));

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  promotion_price?: number | null;
  image_url: string | null;
  additional_images: string[] | null;
  category: string | null;
  age_range: string | null;
  stock_quantity: number;
};

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState<string | null>(null);
  const { translations } = useLanguage();

  const { data: products, isLoading } = useOptimizedQuery(
    ['products', searchQuery, selectedCategory, selectedAgeRange],
    async () => {
      let query = supabase
        .from('products')
        .select('*');

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (selectedAgeRange) {
        query = query.eq('age_range', selectedAgeRange);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return data as Product[];
    },
  );

  const categories = ['Educational', 'Books', 'Science', 'Baby Toys', 'Arts & Crafts'];
  const ageRanges = ['0-2', '3-5', '6-8', '9-12'];

  // Use intersection observer for product loading
  const ProductCardComponent = window.IntersectionObserver ? OptimizedProductCard : ProductCard;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{translations?.shop?.title || "Shop"}</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder={translations?.shop?.searchPlaceholder || "Search products..."}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="border rounded-md px-3 py-2"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
              >
                <option value="">{translations?.shop?.filters?.allCategories || "All Categories"}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                className="border rounded-md px-3 py-2"
                value={selectedAgeRange || ''}
                onChange={(e) => setSelectedAgeRange(e.target.value || null)}
              >
                <option value="">{translations?.shop?.filters?.allAges || "All Ages"}</option>
                {ageRanges.map((range) => (
                  <option key={range} value={range}>
                    {range} {translations?.shop?.filters?.years || "years"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products?.map((product) => (
              <Suspense 
                key={product.id} 
                fallback={
                  <div className="animate-pulse bg-gray-200 rounded-lg aspect-square"></div>
                }
              >
                <ProductCardComponent product={product} />
              </Suspense>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;

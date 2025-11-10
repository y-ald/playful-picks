import { useState, lazy, Suspense, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseQuery } from "@/hooks/useDataFetching";
import { debounce } from "@/lib/utils";

// Lazy load components
const ProductCard = lazy(() => import("@/components/ProductCard"));
const OptimizedProductCard = lazy(
  () => import("@/components/OptimizedProductCard")
);

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState<string | null>(null);
  const { translations } = useLanguage();

  // Memoize the query function to avoid unnecessary re-renders
  const queryFn = useCallback(() => {
    let query = supabase.from("products").select("*");

    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`);
    }

    if (selectedCategory) {
      query = query.eq("category", selectedCategory);
    }

    if (selectedAgeRange) {
      query = query.eq("age_range", selectedAgeRange);
    }

    return query;
  }, [searchQuery, selectedCategory, selectedAgeRange]);

  // Use our optimized query hook
  const { data: products, isLoading } = useSupabaseQuery<Product[]>(
    ["products", searchQuery, selectedCategory, selectedAgeRange],
    "products",
    queryFn
  );

  // Debounced search handler
  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearchQuery(e.target.value);
  };

  const categories = [
    "Educational",
    "Books",
    "Science",
    "Baby Toys",
    "Arts & Crafts",
  ];
  const ageRanges = ["0-2", "3-5", "6-8", "9-12"];

  // Use intersection observer for product loading
  const ProductCardComponent = window.IntersectionObserver
    ? OptimizedProductCard
    : ProductCard;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {translations?.shop?.title || "Shop"}
          </h1>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder={
                    translations?.shop?.searchPlaceholder ||
                    "Search products..."
                  }
                  className="pl-10"
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="border rounded-md px-3 py-2"
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
              >
                <option value="">
                  {translations?.shop?.filters?.allCategories ||
                    "All Categories"}
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                className="border rounded-md px-3 py-2"
                value={selectedAgeRange || ""}
                onChange={(e) => setSelectedAgeRange(e.target.value || null)}
              >
                <option value="">
                  {translations?.shop?.filters?.allAges || "All Ages"}
                </option>
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products?.map((product) => (
              <Suspense
                key={product.id}
                fallback={
                  <div className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
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

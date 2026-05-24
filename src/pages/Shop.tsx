import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSupabaseQuery } from "@/hooks/useDataFetching";
import { debounce } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";

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

  const queryFn = useCallback(() => {
    let query = supabase.from("products").select("*");
    if (searchQuery) query = query.ilike("name", `%${searchQuery}%`);
    if (selectedCategory) query = query.eq("category", selectedCategory);
    if (selectedAgeRange) query = query.eq("age_range", selectedAgeRange);
    return query;
  }, [searchQuery, selectedCategory, selectedAgeRange]);

  const { data: products, isLoading } = useSupabaseQuery<Product[]>(
    ["products", searchQuery, selectedCategory, selectedAgeRange],
    "products",
    queryFn
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 300),
    []
  );

  const categories = ["Educational", "Books", "Science", "Baby Toys", "Arts & Crafts"];
  const ageRanges = ["0-2", "3-5", "6-8", "9-12"];

  const activeFilters = [
    selectedCategory && { label: selectedCategory, clear: () => setSelectedCategory(null) },
    selectedAgeRange && { label: `${selectedAgeRange} years`, clear: () => setSelectedAgeRange(null) },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="min-h-screen bg-background">
      {/* Shop header */}
      <section className="bg-secondary-light pt-32 pb-12 border-b border-border">
        <div className="container mx-auto px-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
            All products
          </p>
          <h1 className="font-display text-4xl lg:text-6xl font-light text-ink mb-6 text-balance">
            {translations?.shop?.title || "Shop the collection"}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            {products?.length || 0} pieces — selected for everyday play and quiet moments.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={translations?.shop?.searchPlaceholder || "Search products..."}
                className="pl-10 h-11 bg-transparent border-border rounded-none"
                onChange={(e) => debouncedSetSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-11 px-4 bg-transparent border border-border text-sm rounded-none focus:outline-none focus:border-ink"
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
              >
                <option value="">
                  {translations?.shop?.filters?.allCategories || "All categories"}
                </option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                className="h-11 px-4 bg-transparent border border-border text-sm rounded-none focus:outline-none focus:border-ink"
                value={selectedAgeRange || ""}
                onChange={(e) => setSelectedAgeRange(e.target.value || null)}
              >
                <option value="">
                  {translations?.shop?.filters?.allAges || "All ages"}
                </option>
                {ageRanges.map((r) => (
                  <option key={r} value={r}>
                    {r} {translations?.shop?.filters?.years || "years"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mr-2">Filters:</span>
              {activeFilters.map((f) => (
                <button
                  key={f.label}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1.5 px-3 py-1 border border-ink text-xs tracking-wider uppercase hover:bg-ink hover:text-background transition-colors"
                >
                  {f.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product grid */}
      <section className="container mx-auto px-6 py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 lg:gap-x-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] bg-muted animate-pulse" />
                <div className="h-3 w-3/4 bg-muted animate-pulse" />
                <div className="h-3 w-1/3 bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-2xl text-ink mb-3">No products found</p>
            <p className="text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 lg:gap-x-5">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Shop;

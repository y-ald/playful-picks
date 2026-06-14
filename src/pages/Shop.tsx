import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Check } from "lucide-react";
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

const CATEGORIES = ["Educational", "Books", "Science", "Baby Toys", "Arts & Crafts"];
const AGE_RANGES = ["0-2", "3-5", "6-8", "9-12"];

const parseList = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    parseList(searchParams.get("category"))
  );
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>(() =>
    parseList(searchParams.get("age"))
  );
  const { translations } = useLanguage();
  const t = translations?.shop || {};
  const f = t.filters || {};

  // Sync URL <- state
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (selectedCategories.length) next.set("category", selectedCategories.join(","));
    else next.delete("category");
    if (selectedAgeRanges.length) next.set("age", selectedAgeRanges.join(","));
    else next.delete("age");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedAgeRanges]);

  const queryFn = useCallback(() => {
    let query = supabase.from("products").select("*");
    if (searchQuery) query = query.ilike("name", `%${searchQuery}%`);
    if (selectedCategories.length) query = query.in("category", selectedCategories);
    if (selectedAgeRanges.length) query = query.in("age_range", selectedAgeRanges);
    return query;
  }, [searchQuery, selectedCategories, selectedAgeRanges]);

  const { data: products, isLoading } = useSupabaseQuery<Product[]>(
    ["products", searchQuery, selectedCategories.join(","), selectedAgeRanges.join(",")],
    "products",
    queryFn
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 300),
    []
  );

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const activeFilters = [
    ...selectedCategories.map((c) => ({
      label: c,
      clear: () => setSelectedCategories(selectedCategories.filter((v) => v !== c)),
    })),
    ...selectedAgeRanges.map((a) => ({
      label: `${a} ${f.years || "years"}`,
      clear: () => setSelectedAgeRanges(selectedAgeRanges.filter((v) => v !== a)),
    })),
  ];

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedAgeRanges([]);
  };

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs tracking-wider uppercase transition-colors ${
        active ? "bg-ink text-background border-ink" : "border-border text-ink hover:border-ink"
      }`}
    >
      {active && <Check className="w-3 h-3" />}
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-secondary-light pt-32 pb-12 border-b border-border">
        <div className="container mx-auto px-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
            {t.eyebrow || "All products"}
          </p>
          <h1 className="font-display text-4xl lg:text-6xl font-light text-ink mb-6 text-balance">
            {t.title || "Shop the collection"}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            {(t.resultsCount || "{count} pieces").replace("{count}", String(products?.length || 0))}
          </p>
        </div>
      </section>

      <section className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-6 py-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder || "Search products..."}
                className="pl-10 h-11 bg-transparent border-border rounded-none"
                onChange={(e) => debouncedSetSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mr-2">
                {f.category || "Category"}:
              </span>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  active={selectedCategories.includes(c)}
                  onClick={() => toggle(selectedCategories, setSelectedCategories, c)}
                >
                  {c}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mr-2">
                {f.age || "Age"}:
              </span>
              {AGE_RANGES.map((a) => (
                <Chip
                  key={a}
                  active={selectedAgeRanges.includes(a)}
                  onClick={() => toggle(selectedAgeRanges, setSelectedAgeRanges, a)}
                >
                  {a} {f.years || "years"}
                </Chip>
              ))}
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mr-2">
                {f.active || "Filters"}:
              </span>
              {activeFilters.map((af) => (
                <button
                  key={af.label}
                  onClick={af.clear}
                  className="inline-flex items-center gap-1.5 px-3 py-1 border border-ink text-xs tracking-wider uppercase hover:bg-ink hover:text-background transition-colors"
                >
                  {af.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={clearAll}
                className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground hover:text-ink underline underline-offset-4 ml-2"
              >
                {f.clearAll || "Clear all"}
              </button>
            </div>
          )}
        </div>
      </section>

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
            <p className="font-display text-2xl text-ink mb-3">{t.noResults || "No products found"}</p>
            <p className="text-muted-foreground">{t.tryAdjusting || "Try adjusting your filters."}</p>
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

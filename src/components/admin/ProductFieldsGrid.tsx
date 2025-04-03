
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

export type ProductFormValues = {
  name: string;
  description: string;
  price: number;
  promotion_price?: number | null;
  stock_quantity: number;
  category: string;
  age_range: string;
};

interface ProductFieldsGridProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductFieldsGrid({ form }: ProductFieldsGridProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Product name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Product description" 
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="promotion_price"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Promotion Price ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="Optional" 
                  value={value === null ? '' : value} 
                  onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="stock_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Quantity</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <select 
                  className="w-full border border-input bg-background h-10 px-3 py-2 rounded-md"
                  {...field}
                >
                  <option value="">Select a category</option>
                  <option value="Educational">Educational</option>
                  <option value="Books">Books</option>
                  <option value="Science">Science</option>
                  <option value="Baby Toys">Baby Toys</option>
                  <option value="Arts & Crafts">Arts & Crafts</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="age_range"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Age Range</FormLabel>
              <FormControl>
                <select 
                  className="w-full border border-input bg-background h-10 px-3 py-2 rounded-md"
                  {...field}
                >
                  <option value="">Select an age range</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-8">6-8 years</option>
                  <option value="9-12">9-12 years</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}


import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  age_range: string;
}

// Using Partial to make all properties optional for compatibility
interface ProductFieldsGridProps {
  form: UseFormReturn<Partial<ProductFormValues> | ProductFormValues>;
}

export function ProductFieldsGrid({ form }: ProductFieldsGridProps) {
  const categories = ['Educational', 'Books', 'Science', 'Baby Toys', 'Arts & Crafts'];
  const ageRanges = ['0-2', '3-5', '6-8', '9-12'];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" step="0.01" />
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
              <FormLabel>Quantity in Stock</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" step="1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  {...field}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
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
            <FormItem>
              <FormLabel>Age Range</FormLabel>
              <FormControl>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  {...field}
                >
                  <option value="">Select age range</option>
                  {ageRanges.map((range) => (
                    <option key={range} value={range}>
                      {range} years
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

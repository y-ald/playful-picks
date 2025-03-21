
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const productSchema = z.object({
  name: z.string().min(3, { message: 'Product name is required' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  stock_quantity: z.coerce.number().int().nonnegative({ message: 'Quantity must be a non-negative integer' }),
  category: z.string().min(1, { message: 'Category is required' }),
  age_range: z.string().min(1, { message: 'Age range is required' }),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function AddProductForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock_quantity: 0,
      category: '',
      age_range: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      let image_url = null;
      
      // Upload image if one is selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        // Check if products bucket exists, create it if not
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find(bucket => bucket.name === 'products')) {
          await supabase.storage.createBucket('products', { public: true });
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, selectedImage);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL for the uploaded image
        const { data: publicURL } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
          
        image_url = publicURL.publicUrl;
      }
      
      // Insert product into the database
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          ...data,
          image_url,
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Product Added",
        description: `${data.name} has been added to inventory`,
      });
      
      // Reset form and image preview
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
      
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Could not add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Product preview" 
                  className="mx-auto max-h-48 object-contain" 
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  Click to upload or drag and drop
                </p>
                <Input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('product-image')?.click()}
                >
                  Select Image
                </Button>
              </div>
            )}
          </div>

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
                <FormItem>
                  <FormLabel>Age Range</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      {...field}
                    >
                      <option value="">Select age range</option>
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
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding Product
            </>
          ) : (
            'Add Product'
          )}
        </Button>
      </form>
    </Form>
  );
}

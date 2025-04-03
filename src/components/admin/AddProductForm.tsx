
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImageUploader } from './ImageUploader';
import { ProductFieldsGrid, ProductFormValues } from './ProductFieldsGrid';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useLanguage } from '@/contexts/LanguageContext';

const productSchema = z.object({
  name: z.string().min(3, { message: 'Product name is required' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  promotion_price: z.coerce.number().positive({ message: 'Promotion price must be a positive number' }).nullable().optional(),
  stock_quantity: z.coerce.number().int().nonnegative({ message: 'Quantity must be a non-negative integer' }),
  category: z.string().min(1, { message: 'Category is required' }),
  age_range: z.string().min(1, { message: 'Age range is required' }),
});

export function AddProductForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const { toast } = useToast();
  const { translations } = useLanguage();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      promotion_price: null,
      stock_quantity: 0,
      category: '',
      age_range: '',
    },
  });

  const handleMainImageChange = (file: File | null) => {
    setMainImage(file);
    if (file) {
      setMainImagePreview(URL.createObjectURL(file));
    } else {
      setMainImagePreview(null);
    }
  };

  const handleAdditionalImagesChange = (files: File[]) => {
    setAdditionalImages(prev => [...prev, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Resize image before upload
    const resizedImageBlob = await resizeImage(file);
    const resizedImageFile = new File([resizedImageBlob], fileName, {
      type: file.type,
    });
    
    // Check if products bucket exists, create it if not
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === bucket)) {
      await supabase.storage.createBucket(bucket, { public: true });
    }
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, resizedImageFile);
      
    if (uploadError) {
      throw uploadError;
    }
    
    const { data: publicURL } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return publicURL.publicUrl;
  };

  // Image resizing function
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, file.type);
      };
      
      img.onerror = () => {
        reject(new Error('Image loading error'));
      };
    });
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      let mainImageUrl = null;
      let additionalImageUrls: string[] = [];
      
      // Upload main image
      if (mainImage) {
        mainImageUrl = await uploadImage(mainImage, 'products');
      }
      
      // Upload additional images
      if (additionalImages.length > 0) {
        const uploadPromises = additionalImages.map(img => uploadImage(img, 'products'));
        additionalImageUrls = await Promise.all(uploadPromises);
      }
      
      // Insert product into the database with proper types
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description,
          price: data.price,
          promotion_price: data.promotion_price,
          stock_quantity: data.stock_quantity,
          category: data.category,
          age_range: data.age_range,
          image_url: mainImageUrl,
          additional_images: additionalImageUrls,
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
      
      // Reset form and image previews
      form.reset();
      setMainImage(null);
      setMainImagePreview(null);
      setAdditionalImages([]);
      setAdditionalImagePreviews([]);
      
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
        <ImageUploader 
          mainImagePreview={mainImagePreview}
          additionalImagePreviews={additionalImagePreviews}
          onMainImageChange={handleMainImageChange}
          onAdditionalImagesChange={handleAdditionalImagesChange}
          onRemoveAdditionalImage={handleRemoveAdditionalImage}
        />

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
          
          <ProductFieldsGrid form={form} />
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

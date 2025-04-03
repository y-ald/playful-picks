import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  promotion_price: z.coerce.number().positive({ message: 'Promotion price must be a positive number' }).nullable().optional(),
  stock_quantity: z.coerce.number().int().nonnegative({ message: 'Quantity must be a non-negative integer' }),
  category: z.string().min(1, { message: 'Category is required' }),
  age_range: z.string().min(1, { message: 'Age range is required' }),
});

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  promotion_price?: number | null;
  image_url: string | null;
  additional_images?: string[];
  category: string | null;
  age_range: string | null;
  stock_quantity: number;
};

interface ProductEditModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ProductEditModal({ product, isOpen, onClose, onUpdate }: ProductEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(product.image_url);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>(
    product.additional_images || []
  );
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<string[]>(
    product.additional_images || []
  );
  const { toast } = useToast();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      promotion_price: product.promotion_price || null,
      stock_quantity: product.stock_quantity || 0,
      category: product.category || '',
      age_range: product.age_range || '',
    },
  });

  useEffect(() => {
    form.reset({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      promotion_price: product.promotion_price || null,
      stock_quantity: product.stock_quantity || 0,
      category: product.category || '',
      age_range: product.age_range || '',
    });
    setMainImagePreview(product.image_url);
    setExistingAdditionalImages(product.additional_images || []);
    setAdditionalImagePreviews(product.additional_images || []);
    setMainImage(null);
    setAdditionalImages([]);
  }, [product, form]);

  const handleMainImageChange = (file: File | null) => {
    setMainImage(file);
    if (file) {
      setMainImagePreview(URL.createObjectURL(file));
    } else {
      setMainImagePreview(product.image_url);
    }
  };

  const handleAdditionalImagesChange = (files: File[]) => {
    setAdditionalImages(prev => [...prev, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveAdditionalImage = (index: number) => {
    if (index < existingAdditionalImages.length) {
      // It's an existing image from the database
      setExistingAdditionalImages(prev => prev.filter((_, i) => i !== index));
    } else {
      // It's a newly added image
      const adjustedIndex = index - existingAdditionalImages.length;
      setAdditionalImages(prev => prev.filter((_, i) => i !== adjustedIndex));
    }
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

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

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    const resizedImageBlob = await resizeImage(file);
    const resizedImageFile = new File([resizedImageBlob], fileName, {
      type: file.type,
    });
    
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, resizedImageFile);
      
    if (uploadError) {
      throw uploadError;
    }
    
    const { data: publicURL } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);
      
    return publicURL.publicUrl;
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      let mainImageUrl = product.image_url;
      let additionalImageUrls: string[] = [...existingAdditionalImages];
      
      // Upload new main image if one is selected
      if (mainImage) {
        mainImageUrl = await uploadImage(mainImage);
      }
      
      // Upload new additional images
      if (additionalImages.length > 0) {
        const uploadPromises = additionalImages.map(img => uploadImage(img));
        const newAdditionalUrls = await Promise.all(uploadPromises);
        additionalImageUrls = [...additionalImageUrls, ...newAdditionalUrls];
      }
      
      // Update product in the database
      const { data: updatedProduct, error } = await supabase
        .from('products')
        .update({
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
        .eq('id', product.id)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Product Updated",
        description: `${data.name} has been updated successfully`,
      });
      
      onUpdate();
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Could not update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating
                  </>
                ) : (
                  'Update Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

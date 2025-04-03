
import { useState } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductFormValues } from '@/components/admin/ProductFieldsGrid';

export const productSchema = z.object({
  name: z.string().min(3, { message: 'Product name is required' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  promotion_price: z.coerce.number().positive({ message: 'Promotion price must be a positive number' }).nullable().optional(),
  stock_quantity: z.coerce.number().int().nonnegative({ message: 'Quantity must be a non-negative integer' }),
  category: z.string().min(1, { message: 'Category is required' }),
  age_range: z.string().min(1, { message: 'Age range is required' }),
});

export type ProductFormState = {
  mainImage: File | null;
  mainImagePreview: string | null;
  additionalImages: File[];
  additionalImagePreviews: string[];
};

export const useProductForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageState, setImageState] = useState<ProductFormState>({
    mainImage: null,
    mainImagePreview: null,
    additionalImages: [],
    additionalImagePreviews: [],
  });
  const { toast } = useToast();

  const handleMainImageChange = (file: File | null) => {
    setImageState(prev => ({
      ...prev,
      mainImage: file,
      mainImagePreview: file ? URL.createObjectURL(file) : null,
    }));
  };

  const handleAdditionalImagesChange = (files: File[]) => {
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setImageState(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, ...files],
      additionalImagePreviews: [...prev.additionalImagePreviews, ...newPreviews],
    }));
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setImageState(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index),
      additionalImagePreviews: prev.additionalImagePreviews.filter((_, i) => i !== index),
    }));
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

  const submitProduct = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      let mainImageUrl = null;
      let additionalImageUrls: string[] = [];
      
      // Upload main image
      if (imageState.mainImage) {
        mainImageUrl = await uploadImage(imageState.mainImage, 'products');
      }
      
      // Upload additional images
      if (imageState.additionalImages.length > 0) {
        const uploadPromises = imageState.additionalImages.map(img => uploadImage(img, 'products'));
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
      
      // Reset image state
      setImageState({
        mainImage: null,
        mainImagePreview: null,
        additionalImages: [],
        additionalImagePreviews: [],
      });
      
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Could not add product. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    imageState,
    handleMainImageChange,
    handleAdditionalImagesChange,
    handleRemoveAdditionalImage,
    submitProduct
  };
};

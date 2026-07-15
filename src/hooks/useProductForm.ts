
import { useState } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductFormValues } from '@/components/admin/ProductFieldsGrid';
import {
  PRODUCTS_BUCKET,
  mainImagePath,
  originalImagePath,
  additionalImagePath,
} from '@/lib/productImages';

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
  originalImage: File | null;
};

export const useProductForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageState, setImageState] = useState<ProductFormState>({
    mainImage: null,
    mainImagePreview: null,
    additionalImages: [],
    additionalImagePreviews: [],
    originalImage: null,
  });
  const { toast } = useToast();

  const handleMainImageChange = (file: File | null) => {
    setImageState(prev => ({
      ...prev,
      mainImage: file,
      mainImagePreview: file ? URL.createObjectURL(file) : null,
      originalImage: null,
    }));
  };

  const handleEnhancedMainImage = (
    enhancedFile: File,
    originalSource: { file: File | null; url: string | null },
  ) => {
    setImageState(prev => ({
      ...prev,
      mainImage: enhancedFile,
      mainImagePreview: URL.createObjectURL(enhancedFile),
      originalImage: originalSource.file ?? prev.originalImage ?? prev.mainImage,
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

  const uploadImage = async (file: File, path: string) => {
    // Resize image before upload
    const resizedImageBlob = await resizeImage(file);
    const resizedImageFile = new File([resizedImageBlob], path.split('/').pop() as string, {
      type: file.type,
    });
    
    // Check if products bucket exists, create it if not
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === PRODUCTS_BUCKET)) {
      await supabase.storage.createBucket(PRODUCTS_BUCKET, { public: true });
    }
    
    const { error: uploadError } = await supabase.storage
      .from(PRODUCTS_BUCKET)
      .upload(path, resizedImageFile, { upsert: false });
      
    if (uploadError) {
      throw uploadError;
    }
    
    const { data: publicURL } = supabase.storage
      .from(PRODUCTS_BUCKET)
      .getPublicUrl(path);
      
    return publicURL.publicUrl;
  };

  const submitProduct = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Generate the product id up-front so all its images can be grouped
      // under a single storage folder: products/{productId}/...
      const productId =
        (crypto as any)?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      let mainImageUrl: string | null = null;
      let originalImageUrl: string | null = null;
      let additionalImageUrls: string[] = [];
      
      if (imageState.mainImage) {
        mainImageUrl = await uploadImage(imageState.mainImage, mainImagePath(productId, imageState.mainImage));
      }

      if (imageState.originalImage) {
        originalImageUrl = await uploadImage(imageState.originalImage, originalImagePath(productId, imageState.originalImage));
      }
      
      if (imageState.additionalImages.length > 0) {
        const uploadPromises = imageState.additionalImages.map(img =>
          uploadImage(img, additionalImagePath(productId, img)),
        );
        additionalImageUrls = await Promise.all(uploadPromises);
      }
      
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          id: productId,
          name: data.name,
          description: data.description,
          price: data.price,
          promotion_price: data.promotion_price,
          stock_quantity: data.stock_quantity,
          category: data.category,
          age_range: data.age_range,
          image_url: mainImageUrl,
          original_image_url: originalImageUrl,
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
      
      setImageState({
        mainImage: null,
        mainImagePreview: null,
        additionalImages: [],
        additionalImagePreviews: [],
        originalImage: null,
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
    handleEnhancedMainImage,
    submitProduct
  };
};

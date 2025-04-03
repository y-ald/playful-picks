
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductFormValues } from '@/components/admin/ProductFieldsGrid';
import { productSchema } from '@/hooks/useProductForm';

export type Product = {
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

export type ProductEditState = {
  mainImage: File | null;
  mainImagePreview: string | null;
  additionalImages: File[];
  additionalImagePreviews: string[];
  existingAdditionalImages: string[];
};

export const useProductEdit = (product: Product, onComplete: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageState, setImageState] = useState<ProductEditState>({
    mainImage: null,
    mainImagePreview: product.image_url,
    additionalImages: [],
    additionalImagePreviews: product.additional_images || [],
    existingAdditionalImages: product.additional_images || [],
  });
  const { toast } = useToast();

  useEffect(() => {
    // Reset image state when product changes
    setImageState({
      mainImage: null,
      mainImagePreview: product.image_url,
      additionalImages: [],
      additionalImagePreviews: product.additional_images || [],
      existingAdditionalImages: product.additional_images || [],
    });
  }, [product]);

  const handleMainImageChange = (file: File | null) => {
    setImageState(prev => ({
      ...prev,
      mainImage: file,
      mainImagePreview: file ? URL.createObjectURL(file) : product.image_url,
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
    if (index < imageState.existingAdditionalImages.length) {
      // It's an existing image from the database
      setImageState(prev => ({
        ...prev,
        existingAdditionalImages: prev.existingAdditionalImages.filter((_, i) => i !== index),
        additionalImagePreviews: prev.additionalImagePreviews.filter((_, i) => i !== index),
      }));
    } else {
      // It's a newly added image
      const adjustedIndex = index - imageState.existingAdditionalImages.length;
      setImageState(prev => ({
        ...prev,
        additionalImages: prev.additionalImages.filter((_, i) => i !== adjustedIndex),
        additionalImagePreviews: prev.additionalImagePreviews.filter((_, i) => i !== index),
      }));
    }
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

  const updateProduct = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      let mainImageUrl = product.image_url;
      let additionalImageUrls: string[] = [...imageState.existingAdditionalImages];
      
      // Upload new main image if one is selected
      if (imageState.mainImage) {
        mainImageUrl = await uploadImage(imageState.mainImage);
      }
      
      // Upload new additional images
      if (imageState.additionalImages.length > 0) {
        const uploadPromises = imageState.additionalImages.map(img => uploadImage(img));
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
      
      onComplete();
      return true;
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Could not update product. Please try again.",
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
    updateProduct
  };
};

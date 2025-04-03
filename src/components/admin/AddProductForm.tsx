
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { ImageUploader } from './ImageUploader';
import { ProductFieldsGrid, ProductFormValues } from './ProductFieldsGrid';
import { SubmitButton } from './SubmitButton';
import { useProductForm, productSchema } from '@/hooks/useProductForm';
import { useLanguage } from '@/contexts/LanguageContext';

export function AddProductForm() {
  const { imageState, isSubmitting, handleMainImageChange, handleAdditionalImagesChange, 
    handleRemoveAdditionalImage, submitProduct } = useProductForm();
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

  const onSubmit = async (data: ProductFormValues) => {
    const success = await submitProduct(data);
    if (success) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ImageUploader 
          mainImagePreview={imageState.mainImagePreview}
          additionalImagePreviews={imageState.additionalImagePreviews}
          onMainImageChange={handleMainImageChange}
          onAdditionalImagesChange={handleAdditionalImagesChange}
          onRemoveAdditionalImage={handleRemoveAdditionalImage}
        />

        <ProductFieldsGrid form={form} />
        
        <SubmitButton 
          isSubmitting={isSubmitting} 
          label="Add Product" 
          loadingLabel="Adding Product" 
        />
      </form>
    </Form>
  );
}

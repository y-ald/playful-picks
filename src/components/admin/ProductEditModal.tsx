
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ImageUploader } from './ImageUploader';
import { ProductFieldsGrid, ProductFormValues } from './ProductFieldsGrid';
import { SubmitButton } from './SubmitButton';
import { productSchema } from '@/hooks/useProductForm';
import { useProductEdit, Product } from '@/hooks/useProductEdit';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ProductEditModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ProductEditModal({ product, isOpen, onClose, onUpdate }: ProductEditModalProps) {
  const { 
    isSubmitting, 
    imageState, 
    handleMainImageChange, 
    handleAdditionalImagesChange, 
    handleRemoveAdditionalImage, 
    updateProduct 
  } = useProductEdit(product, onUpdate);
  
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
    // Reset form when product changes
    form.reset({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      promotion_price: product.promotion_price || null,
      stock_quantity: product.stock_quantity || 0,
      category: product.category || '',
      age_range: product.age_range || '',
    });
  }, [product, form]);

  const onSubmit = async (data: ProductFormValues) => {
    await updateProduct(data);
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
              mainImagePreview={imageState.mainImagePreview}
              additionalImagePreviews={imageState.additionalImagePreviews}
              onMainImageChange={handleMainImageChange}
              onAdditionalImagesChange={handleAdditionalImagesChange}
              onRemoveAdditionalImage={handleRemoveAdditionalImage}
            />

            <ProductFieldsGrid form={form} />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton 
                isSubmitting={isSubmitting} 
                label="Update Product" 
                loadingLabel="Updating Product" 
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

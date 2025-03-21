
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useProfile, AddressData } from '@/hooks/useProfile';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const addressSchema = z.object({
  street_address: z.string().min(3, { message: 'Street address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(2, { message: 'State is required' }),
  postal_code: z.string().min(3, { message: 'Postal code is required' }),
  country: z.string().min(2, { message: 'Country is required' }),
  is_default: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  address?: AddressData;
  onComplete: () => void;
}

export function AddressForm({ address, onComplete }: AddressFormProps) {
  const { addAddress, updateAddress } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!address;
  
  // Initialize the form with address data if editing
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street_address: address?.street_address || '',
      city: address?.city || '',
      state: address?.state || '',
      postal_code: address?.postal_code || '',
      country: address?.country || '',
      is_default: address?.is_default || false,
    },
  });

  const onSubmit = async (data: AddressFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && address) {
        await updateAddress(address.id, data);
      } else {
        await addAddress(data);
      }
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="street_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123 Main St" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="City" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State/Province</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="State" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Postal code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Country" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as default address</FormLabel>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onComplete}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {isEditing ? 'Updating' : 'Adding'}
              </>
            ) : (
              isEditing ? 'Update Address' : 'Add Address'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

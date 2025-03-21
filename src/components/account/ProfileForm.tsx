
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useProfile, ProfileData } from '@/hooks/useProfile';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileSchema = z.object({
  first_name: z.string().min(2, { message: 'First name is required' }).max(50),
  last_name: z.string().min(2, { message: 'Last name is required' }).max(50),
  phone_number: z.string().min(5, { message: 'Phone number is required' }).max(15),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { profileData, updateProfile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form with profile data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profileData?.first_name || '',
      last_name: profileData?.last_name || '',
      phone_number: profileData?.phone_number || '',
    },
    values: {
      first_name: profileData?.first_name || '',
      last_name: profileData?.last_name || '',
      phone_number: profileData?.phone_number || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      await updateProfile(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="First name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Last name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Phone number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>
    </Form>
  );
}

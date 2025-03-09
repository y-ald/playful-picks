import { useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mapboxClient } from "@/integrations/mapbox/client";
import { useState } from "react";
import { ScrollArea, ScrollBar, ScrollAreaPrimitive } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State/Province must be at least 2 characters"),
  zipCode: z.string().min(5, "Postal code must be at least 5 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  shipping_rate: z.string().optional(),
});

interface ShippingFormProps {
  form: any;
  countries: { name: string; code: string }[];
  handleAddressSubmit: (values: z.infer<typeof formSchema>) => void;
  loading: boolean;
}

export default function ShippingForm({ form, countries, handleAddressSubmit, loading }: ShippingFormProps) {
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (query: string, country: string) => {
    const language = 'en'; // You can make this dynamic based on user preference
    try {
      const results = await mapboxClient.forward(query, language, country);
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error('Error searching address:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleAddressSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} className="text-lg" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} className="text-lg" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input {...field} className="text-lg" />
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="text-lg"
                  onChange={(e) => {
                    field.onChange(e);
                    handleSearch(e.target.value, form.watch('country'));
                  }}
                />
              </FormControl>
              <FormMessage />
              {searchResults.length > 0 && (
                <ScrollArea className="h-40">
                  <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
                    <div className="mt-2">
                      {searchResults.map((result: any) => (
                        <div
                          key={result.id}
                          className="p-2 border rounded cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            form.setValue('address', result.properties.address);
                            form.setValue('city', result.properties.context.place.name || '');
                            form.setValue('state', result.properties.context.region.name || '');
                            form.setValue('zipCode', result.properties.context.postcode.name || '');
                            setSearchResults([]);
                          }}
                        >
                          {result.properties.full_address}
                        </div>
                      ))}
                    </div>
                  </ScrollAreaPrimitive.Viewport>
                  <ScrollBar />
                </ScrollArea>
              )}
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} className="text-lg" />
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
                <FormLabel>Province/State</FormLabel>
                <FormControl>
                  <Input {...field} className="text-lg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full text-lg py-6" 
          disabled={loading}
        >
          Calculate Shipping
        </Button>
      </form>
    </Form>
  );
}

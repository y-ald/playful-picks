import { useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import { useAuth } from "@/contexts/AuthContext";

interface ImprovedShippingFormProps {
  cartItems: any[];
  countries: { name: string; code: string }[];
  onShippingRatesCalculated: (rates: any[]) => void;
  onRateSelected: (rate: any) => void;
  onFormSubmit?: (values: any) => void;
}

export default function ImprovedShippingForm({
  cartItems,
  countries,
  onShippingRatesCalculated,
  onRateSelected,
  onFormSubmit,
}: ImprovedShippingFormProps) {
  const { userInfo } = useAuth();
  const {
    form,
    searchResults,
    shippingRates,
    selectedRate,
    isCalculatingRates,
    selectedCountry,
    handleCountryChange,
    handleAddressSearch,
    handleAddressSelect,
    fetchShippingRates,
    setSelectedRate,
  } = useCheckoutForm(cartItems);

  // Pass shipping rates to parent component when they change
  useEffect(() => {
    if (shippingRates.length > 0) {
      onShippingRatesCalculated(shippingRates);
    }
  }, [shippingRates, onShippingRatesCalculated]);

  // Pass form values to parent component when form is submitted
  const handleSubmit = useCallback(
    (values) => {
      fetchShippingRates(values);
      if (onFormSubmit) {
        onFormSubmit(values);
      }
    },
    [fetchShippingRates, onFormSubmit]
  );

  // Pass selected rate to parent component when it changes
  useEffect(() => {
    if (selectedRate) {
      onRateSelected(selectedRate);
    }
  }, [selectedRate, onRateSelected]);

  // Prefill email if user is authenticated
  useEffect(() => {
    if (userInfo?.email) {
      form.setValue("email", userInfo.email);
    }
  }, [userInfo, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
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
                  <Input
                    type="email"
                    {...field}
                    className="text-lg"
                    readOnly={!!userInfo?.email}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleCountryChange(value);
                }}
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
                    handleAddressSearch(
                      e.target.value,
                      form.getValues("country")
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
              {searchResults.length > 0 && (
                <ScrollArea className="h-40 border rounded-md mt-1">
                  <div className="p-1">
                    {searchResults.map((result: any) => (
                      <div
                        key={result.id}
                        className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
                        onClick={() => handleAddressSelect(result)}
                      >
                        {result.properties.full_address}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-3">
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
        </div>

        <Button
          type="submit"
          className="w-full text-lg py-6"
          disabled={isCalculatingRates}
        >
          {isCalculatingRates ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating Shipping...
            </>
          ) : (
            "Calculate Shipping"
          )}
        </Button>
      </form>
    </Form>
  );
}

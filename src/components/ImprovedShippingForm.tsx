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
import { AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
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
    isValidatingAddress,
    addressValidation,
    selectedCountry,
    handleCountryChange,
    handleAddressSearch,
    handleAddressSelect,
    fetchShippingRates,
    setSelectedRate,
    applySuggestedAddress,
    dismissValidation,
  } = useCheckoutForm(cartItems);

  useEffect(() => {
    if (shippingRates.length > 0) {
      onShippingRatesCalculated(shippingRates);
    }
  }, [shippingRates, onShippingRatesCalculated]);

  const handleSubmit = useCallback(
    (values: any) => {
      fetchShippingRates(values);
      if (onFormSubmit) {
        onFormSubmit(values);
      }
    },
    [fetchShippingRates, onFormSubmit]
  );

  const handleUseSuggested = () => {
    if (addressValidation?.suggested_address) {
      applySuggestedAddress(addressValidation.suggested_address);
    }
  };

  const isProcessing = isCalculatingRates || isValidatingAddress;

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
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  {...field}
                  className="text-lg"
                />
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
                        className="p-2 cursor-pointer hover:bg-gray-100 rounded-md text-sm"
                        onClick={() => handleAddressSelect(result)}
                      >
                        <MapPin className="inline-block h-4 w-4 mr-2 text-muted-foreground" />
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

        {/* Address validation feedback */}
        {addressValidation && !addressValidation.is_valid && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800">
                  Address could not be verified
                </p>
                {addressValidation.messages.length > 0 && (
                  <ul className="mt-1 text-sm text-amber-700 space-y-1">
                    {addressValidation.messages.map((msg, i) => (
                      <li key={i}>{msg.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {addressValidation.suggested_address && (
              <div className="rounded-md border border-amber-200 bg-white p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Did you mean this address?
                </p>
                <div className="text-sm text-gray-600 mb-3">
                  <p>{addressValidation.suggested_address.street1}</p>
                  {addressValidation.suggested_address.street2 && (
                    <p>{addressValidation.suggested_address.street2}</p>
                  )}
                  <p>
                    {addressValidation.suggested_address.city},{" "}
                    {addressValidation.suggested_address.state}{" "}
                    {addressValidation.suggested_address.zip}
                  </p>
                  <p>{addressValidation.suggested_address.country}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUseSuggested}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Use suggested address
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={dismissValidation}
                  >
                    Keep my address
                  </Button>
                </div>
              </div>
            )}

            {!addressValidation.suggested_address && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={dismissValidation}
              >
                Continue anyway
              </Button>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full text-lg py-6"
          disabled={isProcessing}
        >
          {isValidatingAddress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying address...
            </>
          ) : isCalculatingRates ? (
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

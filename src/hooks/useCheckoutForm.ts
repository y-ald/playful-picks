import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { mapboxClient } from "@/integrations/mapbox/client";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateParcelSize } from "@/lib/calculateParcelSize";

// Define the form schema with country-specific validations
export const createFormSchema = (country: string) => {
  // Base schema with zipCode included
  const schema: Record<string, any> = {
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    state: z.string().min(2, "State/Province must be at least 2 characters"),
    country: z.string().min(2, "Country must be at least 2 characters"),
    zipCode: z.string().min(5, "Postal code must be at least 5 characters"), // Default validation
    shipping_rate: z.string().optional(),
  };

  // Add country-specific postal code validation
  switch (country) {
    case "US":
      schema.zipCode = z
        .string()
        .regex(
          /^\d{5}(-\d{4})?$/,
          "US ZIP code must be in format 12345 or 12345-6789"
        );
      break;
    case "CA":
      schema.zipCode = z
        .string()
        .regex(
          /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
          "Canadian postal code must be in format A1A 1A1"
        );
      break;
    case "GB":
      schema.zipCode = z
        .string()
        .regex(
          /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/,
          "UK postal code must be in a valid format"
        );
      break;
    case "FR":
      schema.zipCode = z
        .string()
        .regex(/^\d{5}$/, "French postal code must be 5 digits");
      break;
    case "DE":
      schema.zipCode = z
        .string()
        .regex(/^\d{5}$/, "German postal code must be 5 digits");
      break;
    case "AU":
      schema.zipCode = z
        .string()
        .regex(/^\d{4}$/, "Australian postal code must be 4 digits");
      break;
    case "BE":
      schema.zipCode = z
        .string()
        .regex(/^\d{4}$/, "Belgian postal code must be 4 digits");
      break;
    case "ES":
      schema.zipCode = z
        .string()
        .regex(/^\d{5}$/, "Spanish postal code must be 5 digits");
      break;
    default:
      schema.zipCode = z
        .string()
        .min(5, "Postal code must be at least 5 characters");
  }

  return z.object(schema);
};

export const useCheckoutForm = (cartItems: any[]) => {
  const { toast } = useToast();
  const { userInfo } = useAuth();
  const [searchResults, setSearchResults] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [isCalculatingRates, setIsCalculatingRates] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("CA"); // Default to Canada

  // Create form with dynamic schema based on selected country
  const formSchema = createFormSchema(selectedCountry);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: userInfo?.email || "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: selectedCountry,
      shipping_rate: "",
    },
  });

  // Update form schema when country changes
  useEffect(() => {
    const newSchema = createFormSchema(selectedCountry);
    form.clearErrors("zipCode");

    // We can't directly update the resolver, so we'll recreate the form
    // This is a workaround for the TypeScript error
    // In a real application, you might want to use a more elegant solution
    const currentValues = form.getValues();
    form.reset(currentValues);
  }, [selectedCountry, form]);

  // Autofill email when user is authenticated
  useEffect(() => {
    if (userInfo?.email) {
      form.setValue("email", userInfo.email);
    }
  }, [userInfo, form]);

  // Handle country change
  const handleCountryChange = useCallback(
    (country: string) => {
      setSelectedCountry(country);
      form.setValue("country", country);
      // Clear postal code when country changes to avoid validation errors
      form.setValue("zipCode", "");
    },
    [form]
  );

  // Search for addresses using Mapbox
  const handleAddressSearch = useCallback(
    async (query: string, country: string) => {
      if (query.length < 3) {
        setSearchResults([]);
        return;
      }

      try {
        // The mapboxClient.forward function expects 3 arguments: query, language, and country
        const results = await mapboxClient.forward(query, "en", country);
        setSearchResults(results.slice(0, 5)); // Limit to 5 results
      } catch (error) {
        console.error("Error searching address:", error);
        setSearchResults([]);
      }
    },
    [form]
  );

  // Handle address selection from search results
  const handleAddressSelect = useCallback(
    (result: any) => {
      const properties = result.properties;
      const context = properties.context || {};
      console.log("address", context);
      // Extract address components based on country
      const country = form.getValues("country");

      // Set address fields
      form.setValue(
        "address",
        properties.address || properties.full_address || ""
      );

      // Set city, state, and postal code based on country format
      if (context.place) {
        form.setValue("city", context.place.name || "");
      }

      if (context.region) {
        // For US and Canada, use region code; for others, use full name
        const regionValue = ["US", "CA"].includes(country)
          ? context.region.short_code || context.region.name || ""
          : context.region.name || "";

        // Ensure we have a valid value before setting it
        if (regionValue) {
          form.setValue("state", regionValue);
          // Trigger validation after setting the value
          form.trigger("state");
        }
      }

      if (context.postcode) {
        const postcodeValue = context.postcode.name || "";
        if (postcodeValue) {
          form.setValue("zipCode", postcodeValue);
          // Trigger validation after setting the value
          form.trigger("zipCode");
        }
      }

      // Clear search results
      setSearchResults([]);

      // Automatically calculate shipping rates if all required fields are filled
      const requiredFields = [
        "name",
        "email",
        "address",
        "city",
        "state",
        "zipCode",
        "country",
      ];
      const allFieldsFilled = requiredFields.every(
        (field) => !!form.getValues(field)
      );

      if (allFieldsFilled) {
        fetchShippingRates(form.getValues());
      }
    },
    [form]
  );

  // Fetch shipping rates
  const fetchShippingRates = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      setIsCalculatingRates(true);
      try {
        const parcelSize = calculateParcelSize(cartItems.length);

        const { data, error } = await supabase.functions.invoke("shipping", {
          body: {
            action: "getRates",
            payload: {
              address_from: {
                name: "Kaia Kids Store",
                street1: "123 Warehouse St",
                city: "Montreal",
                state: "QC",
                zip: "H2X 1Y6",
                country: "CA",
              },
              address_to: {
                name: values.name,
                street1: values.address,
                city: values.city,
                state: values.state,
                zip: values.zipCode,
                country: values.country,
              },
              parcels: [parcelSize],
            },
          },
        });

        if (error) throw error;

        setShippingRates(data);

        // Auto-select the cheapest shipping option if available
        if (data && data.length > 0) {
          const cheapestRate = data.reduce((prev, curr) =>
            parseFloat(prev.amount) < parseFloat(curr.amount) ? prev : curr
          );
          setSelectedRate(cheapestRate);
        }

        toast({
          title: "Shipping rates calculated",
          description: `${data.length} shipping options available`,
        });
      } catch (error) {
        console.error("Error fetching shipping rates:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch shipping rates",
        });
      } finally {
        setIsCalculatingRates(false);
      }
    },
    [cartItems, toast]
  );

  return {
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
  };
};

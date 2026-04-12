import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { mapboxClient } from "@/integrations/mapbox/client";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateParcelSize } from "@/lib/calculateParcelSize";
import { debounce } from "@/lib/utils";

const CA_POSTAL_TO_PROVINCE: Record<string, string> = {
  A: "NL", B: "NS", C: "PE", E: "NB",
  G: "QC", H: "QC", J: "QC",
  K: "ON", L: "ON", M: "ON", N: "ON", P: "ON",
  R: "MB", S: "SK", T: "AB", V: "BC",
  X: "NT", Y: "YT",
};

export const createFormSchema = (country: string) => {
  const schema: Record<string, any> = {
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    state: z.string().min(2, "State/Province must be at least 2 characters"),
    country: z.string().min(2, "Country must be at least 2 characters"),
    zipCode: z.string().min(5, "Postal code must be at least 5 characters"),
    shipping_rate: z.string().optional(),
  };

  switch (country) {
    case "US":
      schema.zipCode = z.string().regex(/^\d{5}(-\d{4})?$/, "US ZIP code must be in format 12345 or 12345-6789");
      break;
    case "CA":
      schema.zipCode = z.string().regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, "Canadian postal code must be in format A1A 1A1");
      break;
    case "GB":
      schema.zipCode = z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/, "UK postal code must be in a valid format");
      break;
    case "FR":
      schema.zipCode = z.string().regex(/^\d{5}$/, "French postal code must be 5 digits");
      break;
    case "DE":
      schema.zipCode = z.string().regex(/^\d{5}$/, "German postal code must be 5 digits");
      break;
    case "AU":
      schema.zipCode = z.string().regex(/^\d{4}$/, "Australian postal code must be 4 digits");
      break;
    case "BE":
      schema.zipCode = z.string().regex(/^\d{4}$/, "Belgian postal code must be 4 digits");
      break;
    case "ES":
      schema.zipCode = z.string().regex(/^\d{5}$/, "Spanish postal code must be 5 digits");
      break;
    default:
      schema.zipCode = z.string().min(5, "Postal code must be at least 5 characters");
  }

  return z.object(schema);
};

export interface AddressValidation {
  is_valid: boolean;
  messages: { code: string; text: string; type: string }[];
  suggested_address: {
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
}

export const useCheckoutForm = (cartItems: any[]) => {
  const { toast } = useToast();
  const { userInfo } = useAuth();
  const [searchResults, setSearchResults] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [isCalculatingRates, setIsCalculatingRates] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState<AddressValidation | null>(null);
  const skipNextValidation = useRef(false);
  const [selectedCountry, setSelectedCountry] = useState("CA");

  const formSchema = createFormSchema(selectedCountry);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: userInfo?.email || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: selectedCountry,
      shipping_rate: "",
    },
  });

  useEffect(() => {
    form.clearErrors("zipCode");
    const currentValues = form.getValues();
    form.reset(currentValues);
  }, [selectedCountry, form]);

  // Pre-fill from profile + default address
  const prefilled = useRef(false);
  useEffect(() => {
    if (!userInfo?.id || prefilled.current) return;

    const prefillFromProfile = async () => {
      try {
        const [profileRes, addressRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userInfo.id).single(),
          supabase
            .from("user_addresses")
            .select("*")
            .eq("user_id", userInfo.id)
            .eq("is_default", true)
            .maybeSingle(),
        ]);

        const profile = profileRes.data;
        const address = addressRes.data;

        if (profile) {
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
          if (fullName) form.setValue("name", fullName);
          if (profile.phone_number) form.setValue("phone", profile.phone_number);
        }

        if (userInfo.email) {
          form.setValue("email", userInfo.email);
        }

        if (address) {
          form.setValue("address", address.street_address);
          form.setValue("city", address.city);
          form.setValue("state", address.state);
          form.setValue("zipCode", address.postal_code);
          if (address.country) {
            form.setValue("country", address.country);
            setSelectedCountry(address.country);
          }
        }

        prefilled.current = true;
      } catch (err) {
        console.error("Error prefilling checkout form:", err);
      }
    };

    prefillFromProfile();
  }, [userInfo, form]);

  const handleCountryChange = useCallback(
    (country: string) => {
      setSelectedCountry(country);
      form.setValue("country", country);
      form.setValue("zipCode", "");
    },
    [form]
  );

  const searchAddress = useCallback(
    async (query: string, country: string) => {
      if (query.length < 3) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await mapboxClient.forward(query, "en", country);
        setSearchResults(results.slice(0, 5));
      } catch (error) {
        console.error("Error searching address:", error);
        setSearchResults([]);
      }
    },
    []
  );

  const handleAddressSearch = useMemo(
    () => debounce((query: string, country: string) => searchAddress(query, country), 300),
    [searchAddress]
  );

  // Fill form fields from Mapbox feature properties + context
  const fillFormFromFeature = useCallback(
    (properties: any, context: any) => {
      const country = form.getValues("country");
      const featureType = properties.feature_type || "";

      // Street address extraction:
      // POI: properties.address = "27 Rue Couillard" (street), properties.name = "Epicerie..." (business name)
      // address type: properties.name = "27 Rue Couillard", properties.address = "27" (just number)
      let streetAddress = "";
      if (featureType === "poi" && properties.address && /\d/.test(properties.address)) {
        streetAddress = properties.address;
      } else {
        streetAddress = properties.name || properties.address || "";
      }

      if (streetAddress) {
        form.setValue("address", streetAddress);
      }

      if (context.place) {
        form.setValue("city", context.place.name || "");
      }

      // Province/State extraction
      let regionValue = "";

      if (context.region) {
        const rc =
          context.region.region_code ||
          context.region.region_code_full ||
          context.region.short_code ||
          "";

        if (["US", "CA"].includes(country) && rc) {
          regionValue = rc.includes("-") ? rc.split("-")[1] : rc;
        }
        if (!regionValue) {
          regionValue = context.region.name || "";
        }
      }

      // Fallback: derive province from Canadian postal code first letter
      if (!regionValue && country === "CA" && context.postcode?.name) {
        const firstLetter = context.postcode.name.trim().toUpperCase()[0];
        if (firstLetter && CA_POSTAL_TO_PROVINCE[firstLetter]) {
          regionValue = CA_POSTAL_TO_PROVINCE[firstLetter];
        }
      }

      if (regionValue) {
        form.setValue("state", regionValue);
        form.trigger("state");
      }

      if (context.postcode) {
        const postcodeValue = context.postcode.name || "";
        if (postcodeValue) {
          form.setValue("zipCode", postcodeValue);
          form.trigger("zipCode");
        }
      }

      // Auto-update country from Mapbox context
      if (context.country?.country_code) {
        const cc = context.country.country_code;
        if (cc !== country) {
          form.setValue("country", cc);
          setSelectedCountry(cc);
        }
      }
    },
    [form]
  );

  // Handle address selection from search results
  const handleAddressSelect = useCallback(
    async (result: any) => {
      const properties = result.properties;
      const context = properties.context || {};

      setSearchResults([]);

      // Always call /retrieve to get the most complete context (region is often missing from /forward)
      try {
        const detailed = await mapboxClient.retrieve(properties.mapbox_id);
        if (detailed?.properties) {
          const detailedContext = detailed.properties.context || {};
          fillFormFromFeature(
            { ...properties, ...detailed.properties },
            { ...context, ...detailedContext }
          );
        } else {
          fillFormFromFeature(properties, context);
        }
      } catch (err) {
        console.error("Mapbox retrieve error:", err);
        fillFormFromFeature(properties, context);
      }

      // Auto-calculate if all fields are filled
      const requiredFields = ["name", "email", "address", "city", "state", "zipCode", "country"];
      const allFieldsFilled = requiredFields.every((field) => !!form.getValues(field));
      if (allFieldsFilled) {
        fetchShippingRates(form.getValues());
      }
    },
    [form, fillFormFromFeature]
  );

  // Validate address via Shippo
  const validateShippingAddress = useCallback(
    async (values: z.infer<typeof formSchema>): Promise<boolean> => {
      setIsValidatingAddress(true);
      setAddressValidation(null);

      try {
        const { data, error } = await supabase.functions.invoke("shipping", {
          body: {
            action: "validateAddress",
            payload: {
              name: values.name,
              street1: values.address,
              city: values.city,
              state: values.state,
              zip: values.zipCode,
              country: values.country,
            },
          },
        });

        if (error) {
          console.error("Address validation error:", error);
          return true;
        }

        // If suggested address is the same as entered, skip the warning
        if (!data.is_valid && data.suggested_address) {
          const s = data.suggested_address;
          const normalize = (v: string) => (v || "").trim().toLowerCase();
          const isSameAddress =
            normalize(s.street1) === normalize(values.address) &&
            normalize(s.city) === normalize(values.city) &&
            normalize(s.zip) === normalize(values.zipCode) &&
            normalize(s.country) === normalize(values.country);

          if (isSameAddress) {
            setAddressValidation(null);
            return true;
          }
        }

        setAddressValidation(data);
        return data.is_valid;
      } catch (err) {
        console.error("Address validation exception:", err);
        return true;
      } finally {
        setIsValidatingAddress(false);
      }
    },
    []
  );

  // Fetch shipping rates (validates address first unless skipped)
  const fetchShippingRates = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const missingFields = ["address", "city", "state", "zipCode", "country"]
        .filter((f) => !values[f]?.trim());

      if (missingFields.length > 0) {
        toast({
          variant: "destructive",
          title: "Incomplete address",
          description: `Please fill in: ${missingFields.join(", ")}`,
        });
        return;
      }

      setIsCalculatingRates(true);
      setShippingRates([]);
      setSelectedRate(null);

      try {
        if (skipNextValidation.current) {
          skipNextValidation.current = false;
        } else {
          const isValid = await validateShippingAddress(values);
          if (!isValid) {
            setIsCalculatingRates(false);
            return;
          }
        }

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

        if (!data || data.length === 0) {
          toast({
            variant: "destructive",
            title: "No shipping options",
            description: "No shipping rates available for this address. Please check your address and try again.",
          });
          return;
        }

        setShippingRates(data);

        const cheapestRate = data.reduce((prev: any, curr: any) =>
          parseFloat(prev.amount) < parseFloat(curr.amount) ? prev : curr
        );
        setSelectedRate(cheapestRate);

        toast({
          title: "Shipping rates calculated",
          description: `${data.length} shipping options available`,
        });
      } catch (error) {
        console.error("Error fetching shipping rates:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch shipping rates. Please try again.",
        });
      } finally {
        setIsCalculatingRates(false);
      }
    },
    [cartItems, toast, validateShippingAddress]
  );

  // Apply suggested address and calculate rates (skip re-validation)
  const applySuggestedAddress = useCallback(
    (suggested: AddressValidation["suggested_address"]) => {
      if (!suggested) return;
      form.setValue("address", suggested.street1);
      form.setValue("city", suggested.city);
      if (suggested.state) form.setValue("state", suggested.state);
      form.setValue("zipCode", suggested.zip);
      if (suggested.country) {
        form.setValue("country", suggested.country);
        setSelectedCountry(suggested.country);
      }
      setAddressValidation(null);
      skipNextValidation.current = true;

      toast({
        title: "Address updated",
        description: "Calculating shipping rates...",
      });

      setTimeout(() => fetchShippingRates(form.getValues()), 100);
    },
    [form, toast, fetchShippingRates]
  );

  // Dismiss validation and proceed (skip re-validation)
  const dismissValidation = useCallback(() => {
    setAddressValidation(null);
    skipNextValidation.current = true;

    toast({
      title: "Address kept",
      description: "Calculating shipping rates...",
    });

    setTimeout(() => fetchShippingRates(form.getValues()), 100);
  }, [form, toast, fetchShippingRates]);

  return {
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
  };
};

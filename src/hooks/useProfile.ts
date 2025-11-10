import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileData } from "@/models/ProfileData";
import { AddressData } from "@/models/AddressData";
import { useQueryClient } from "@tanstack/react-query";

// Cache keys
const PROFILE_CACHE_KEY = "user_profile_data";
const ADDRESSES_CACHE_KEY = "user_addresses_data";
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, userInfo } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fetchInProgress = useRef<boolean>(false);

  // Get cached data
  const getCachedData = useCallback(<T>(key: string): T | null => {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;

    try {
      const parsed = JSON.parse(cachedData) as CachedData<T>;
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsed.timestamp < CACHE_EXPIRY) {
        return parsed.data;
      }
    } catch (error) {
      console.error(`Error parsing cached data for ${key}:`, error);
    }

    return null;
  }, []);

  // Set cached data
  const setCachedData = useCallback(<T>(key: string, data: T) => {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  }, []);

  // Fetch profile data and addresses
  const fetchProfileData = useCallback(
    async (skipCache = false) => {
      if (!isAuthenticated || fetchInProgress.current) return;

      fetchInProgress.current = true;
      let shouldSetLoading = true;

      try {
        // First check cache if not skipping
        if (!skipCache) {
          const cachedProfile = getCachedData<ProfileData>(PROFILE_CACHE_KEY);
          const cachedAddresses =
            getCachedData<AddressData[]>(ADDRESSES_CACHE_KEY);

          if (cachedProfile || cachedAddresses) {
            if (cachedProfile) setProfileData(cachedProfile);
            if (cachedAddresses) setAddresses(cachedAddresses);

            // If we have both from cache, don't show loading state
            if (cachedProfile && cachedAddresses) {
              shouldSetLoading = false;
            }
          }
        }

        // Only show loading if we don't have cached data
        if (shouldSetLoading) {
          setLoading(true);
        }

        // Use userInfo from auth context instead of making a separate API call
        if (!userInfo) {
          setLoading(false);
          return;
        }

        // Use Promise.all to fetch profile and addresses in parallel
        const [profileResponse, addressesResponse] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userInfo.id).single(),
          supabase
            .from("user_addresses")
            .select("*")
            .eq("user_id", userInfo.id),
        ]);

        // Handle profile data
        if (
          profileResponse.error &&
          profileResponse.error.code !== "PGRST116"
        ) {
          console.error("Error fetching profile:", profileResponse.error);
          throw profileResponse.error;
        }

        // Handle addresses data
        if (addressesResponse.error) {
          console.error("Error fetching addresses:", addressesResponse.error);
          throw addressesResponse.error;
        }

        // Update state and cache
        setProfileData(profileResponse.data);
        setAddresses(addressesResponse.data || []);

        // Cache the results
        setCachedData(PROFILE_CACHE_KEY, profileResponse.data);
        setCachedData(ADDRESSES_CACHE_KEY, addressesResponse.data || []);

        // Update React Query cache
        queryClient.setQueryData(
          ["profile", userInfo.id],
          profileResponse.data
        );
        queryClient.setQueryData(
          ["addresses", userInfo.id],
          addressesResponse.data || []
        );
      } catch (error) {
        console.error("Error in fetchProfileData:", error);
        toast({
          title: "Error fetching profile",
          description: "Could not load your profile information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    },
    [
      isAuthenticated,
      userInfo,
      getCachedData,
      setCachedData,
      toast,
      queryClient,
    ]
  );

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    } else {
      setProfileData(null);
      setAddresses([]);
      setLoading(false);
    }
  }, [isAuthenticated, fetchProfileData]);

  // Update profile
  const updateProfile = useCallback(
    async (data: Partial<ProfileData>) => {
      if (!isAuthenticated || !profileData || !userInfo) return false;

      try {
        // Optimistic update
        const updatedProfile = { ...profileData, ...data };
        setProfileData(updatedProfile);

        // Update cache
        setCachedData(PROFILE_CACHE_KEY, updatedProfile);

        // Update database
        const { error } = await supabase
          .from("profiles")
          .update(data)
          .eq("id", userInfo.id);

        if (error) throw error;

        // Update React Query cache
        queryClient.setQueryData(["profile", userInfo.id], updatedProfile);

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });

        return true;
      } catch (error) {
        console.error("Error updating profile:", error);

        // Revert optimistic update
        fetchProfileData(true);

        toast({
          title: "Error updating profile",
          description: "Could not update your profile information",
          variant: "destructive",
        });
        return false;
      }
    },
    [
      isAuthenticated,
      userInfo,
      profileData,
      setCachedData,
      fetchProfileData,
      toast,
      queryClient,
    ]
  );

  // Add address with optimistic updates
  const addAddress = useCallback(
    async (address: Omit<AddressData, "id">) => {
      if (!isAuthenticated || !userInfo) return null;

      try {
        // Create a temporary ID for optimistic update
        const tempId = `temp_${Date.now()}`;
        const optimisticAddress = {
          ...address,
          id: tempId,
          user_id: userInfo.id,
        };

        // Optimistic update
        const updatedAddresses = [...addresses, optimisticAddress];
        setAddresses(updatedAddresses);

        // Update cache
        setCachedData(ADDRESSES_CACHE_KEY, updatedAddresses);

        // Update database
        const { data, error } = await supabase
          .from("user_addresses")
          .insert({ ...address, user_id: userInfo.id })
          .select()
          .single();

        if (error) throw error;

        // Replace optimistic address with real one
        const finalAddresses = addresses
          .filter((a) => a.id !== tempId)
          .concat(data);
        setAddresses(finalAddresses);

        // Update cache with real data
        setCachedData(ADDRESSES_CACHE_KEY, finalAddresses);

        // Update React Query cache
        queryClient.setQueryData(["addresses", userInfo.id], finalAddresses);

        toast({
          title: "Address added",
          description: "Your address has been added successfully",
        });

        return data;
      } catch (error) {
        console.error("Error adding address:", error);

        // Revert optimistic update by refetching
        fetchProfileData(true);

        toast({
          title: "Error adding address",
          description: "Could not add your address",
          variant: "destructive",
        });
        return null;
      }
    },
    [
      isAuthenticated,
      userInfo,
      addresses,
      setCachedData,
      fetchProfileData,
      toast,
      queryClient,
    ]
  );

  // Update address with optimistic updates
  const updateAddress = useCallback(
    async (id: string, address: Partial<AddressData>) => {
      if (!isAuthenticated || !userInfo) return false;

      try {
        // Optimistic update
        const updatedAddresses = addresses.map((addr) =>
          addr.id === id ? { ...addr, ...address } : addr
        );
        setAddresses(updatedAddresses);

        // Update cache
        setCachedData(ADDRESSES_CACHE_KEY, updatedAddresses);

        // Update database
        const { error } = await supabase
          .from("user_addresses")
          .update(address)
          .eq("id", id);

        if (error) throw error;

        // Update React Query cache
        queryClient.setQueryData(["addresses", userInfo.id], updatedAddresses);

        toast({
          title: "Address updated",
          description: "Your address has been updated successfully",
        });

        return true;
      } catch (error) {
        console.error("Error updating address:", error);

        // Revert optimistic update
        fetchProfileData(true);

        toast({
          title: "Error updating address",
          description: "Could not update your address",
          variant: "destructive",
        });
        return false;
      }
    },
    [
      isAuthenticated,
      userInfo,
      addresses,
      setCachedData,
      fetchProfileData,
      toast,
      queryClient,
    ]
  );

  // Delete address with optimistic updates
  const deleteAddress = useCallback(
    async (id: string) => {
      if (!isAuthenticated || !userInfo) return false;

      try {
        // Optimistic update
        const updatedAddresses = addresses.filter((addr) => addr.id !== id);
        setAddresses(updatedAddresses);

        // Update cache
        setCachedData(ADDRESSES_CACHE_KEY, updatedAddresses);

        // Update database
        const { error } = await supabase
          .from("user_addresses")
          .delete()
          .eq("id", id);

        if (error) throw error;

        // Update React Query cache
        queryClient.setQueryData(["addresses", userInfo.id], updatedAddresses);

        toast({
          title: "Address deleted",
          description: "Your address has been deleted successfully",
        });

        return true;
      } catch (error) {
        console.error("Error deleting address:", error);

        // Revert optimistic update
        fetchProfileData(true);

        toast({
          title: "Error deleting address",
          description: "Could not delete your address",
          variant: "destructive",
        });
        return false;
      }
    },
    [
      isAuthenticated,
      userInfo,
      addresses,
      setCachedData,
      fetchProfileData,
      toast,
      queryClient,
    ]
  );

  // Set default address with optimistic updates
  const setDefaultAddress = useCallback(
    async (id: string) => {
      if (!isAuthenticated || !userInfo) return false;

      try {
        // Optimistic update
        const updatedAddresses = addresses.map((addr) => ({
          ...addr,
          is_default: addr.id === id,
        }));
        setAddresses(updatedAddresses);

        // Update cache
        setCachedData(ADDRESSES_CACHE_KEY, updatedAddresses);

        // Update database
        const { error } = await supabase
          .from("user_addresses")
          .update({ is_default: true })
          .eq("id", id);

        if (error) throw error;

        // Update React Query cache
        queryClient.setQueryData(["addresses", userInfo.id], updatedAddresses);

        toast({
          title: "Default address updated",
          description: "Your default address has been updated",
        });

        return true;
      } catch (error) {
        console.error("Error setting default address:", error);

        // Revert optimistic update
        fetchProfileData(true);

        toast({
          title: "Error updating default address",
          description: "Could not update your default address",
          variant: "destructive",
        });
        return false;
      }
    },
    [
      isAuthenticated,
      userInfo,
      addresses,
      setCachedData,
      fetchProfileData,
      toast,
      queryClient,
    ]
  );

  return {
    profileData,
    addresses,
    loading,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshProfile: () => fetchProfileData(true),
  };
};

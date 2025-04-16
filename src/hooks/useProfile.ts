import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStatus } from "./useAuthStatus";
import { ProfileData } from "@/models/ProfileData";
import { AddressData } from "@/models/AddressData";

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, userInfo } = useAuthStatus();
  const { toast } = useToast();

  // Fetch profile data and addresses
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching profile:", profileError);
          throw profileError;
        }

        // Get addresses
        const { data: addressData, error: addressError } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", user.id);

        if (addressError) {
          console.error("Error fetching addresses:", addressError);
          throw addressError;
        }

        setProfileData(profileData);
        setAddresses(addressData || []);
      } catch (error) {
        toast({
          title: "Error fetching profile",
          description: "Could not load your profile information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, toast]);

  // Update profile
  const updateProfile = async (data: Partial<ProfileData>) => {
    if (!isAuthenticated || !profileData) return false;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return false;

      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;

      setProfileData((prev) => (prev ? { ...prev, ...data } : null));

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "Could not update your profile information",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add address
  const addAddress = async (address: Omit<AddressData, "id">) => {
    if (!isAuthenticated) return null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase
        .from("user_addresses")
        .insert({ ...address, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setAddresses((prev) => [...prev, data]);

      toast({
        title: "Address added",
        description: "Your address has been added successfully",
      });

      return data;
    } catch (error) {
      console.error("Error adding address:", error);
      toast({
        title: "Error adding address",
        description: "Could not add your address",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update address
  const updateAddress = async (id: string, address: Partial<AddressData>) => {
    if (!isAuthenticated) return false;

    try {
      const { error } = await supabase
        .from("user_addresses")
        .update(address)
        .eq("id", id);

      if (error) throw error;

      setAddresses((prev) =>
        prev.map((addr) => (addr.id === id ? { ...addr, ...address } : addr))
      );

      toast({
        title: "Address updated",
        description: "Your address has been updated successfully",
      });

      return true;
    } catch (error) {
      console.error("Error updating address:", error);
      toast({
        title: "Error updating address",
        description: "Could not update your address",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete address
  const deleteAddress = async (id: string) => {
    if (!isAuthenticated) return false;

    try {
      const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAddresses((prev) => prev.filter((addr) => addr.id !== id));

      toast({
        title: "Address deleted",
        description: "Your address has been deleted successfully",
      });

      return true;
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error deleting address",
        description: "Could not delete your address",
        variant: "destructive",
      });
      return false;
    }
  };

  // Set default address
  const setDefaultAddress = async (id: string) => {
    if (!isAuthenticated) return false;

    try {
      const { error } = await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          is_default: addr.id === id,
        }))
      );

      toast({
        title: "Default address updated",
        description: "Your default address has been updated",
      });

      return true;
    } catch (error) {
      console.error("Error setting default address:", error);
      toast({
        title: "Error updating default address",
        description: "Could not update your default address",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    profileData,
    addresses,
    loading,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
};

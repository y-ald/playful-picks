import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

// Constants
const CART_KEY = "cart";
const CART_TIMESTAMP_KEY = "cart_timestamp";
const STORAGE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Types
export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  user_id?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  } | null;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  calculateTotal: (items: CartItem[]) => number;
  clearCart: () => Promise<void>;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, userInfo } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate cart count from items
  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cartItems]);

  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated && userInfo) {
        // Use userInfo from context instead of making a separate API call
        const { data, error } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", userInfo.id);

        if (error) {
          console.error("Error fetching cart items:", error);
          return;
        }

        setCartItems(data || []);
      } else {
        // Check if there's an existing cart in localStorage and if it's still valid
        const storedCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);
        const now = Date.now();

        if (timestamp) {
          const timePassed = now - parseInt(timestamp);
          if (timePassed < STORAGE_TIMEOUT) {
            setCartItems(storedCart);
            return;
          }
        }

        // Clear expired cart
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(CART_TIMESTAMP_KEY);
        setCartItems([]);
      }
    } catch (error) {
      console.error("Error in fetchCartItems:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load cart items",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userInfo, toast]);

  // Initial fetch
  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  // Set up real-time subscription for authenticated users
  useEffect(() => {
    if (isAuthenticated && userInfo) {
      // Use userInfo from context instead of making a separate API call
      const setupSubscription = async () => {
        const channel = supabase
          .channel("cart-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cart_items",
              filter: `user_id=eq.${userInfo.id}`,
            },
            () => {
              fetchCartItems();
              queryClient.invalidateQueries({ queryKey: ["cart"] });
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      };

      const unsubscribe = setupSubscription();

      return () => {
        if (unsubscribe) {
          unsubscribe.then((fn) => fn && fn());
        }
      };
    }
  }, [isAuthenticated, userInfo, fetchCartItems, queryClient]);

  // Add item to cart
  const addToCart = useCallback(
    async (productId: string, quantity: number = 1) => {
      try {
        // Check stock availability first
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("stock_quantity, name")
          .eq("id", productId)
          .single();

        if (productError) {
          console.error("Error fetching product:", productError);
          throw productError;
        }

        if (!product || (product.stock_quantity !== null && product.stock_quantity <= 0)) {
          toast({
            variant: "destructive",
            title: "Out of Stock",
            description: `${product?.name || "This product"} is currently out of stock`,
          });
          return;
        }

        if (isAuthenticated && userInfo) {
          // Use userInfo from context instead of making a separate API call
          const { data: existingItem, error: fetchError } = await supabase
            .from("cart_items")
            .select("*")
            .eq("product_id", productId)
            .eq("user_id", userInfo.id)
            .maybeSingle();

          if (fetchError) {
            console.error("Error fetching cart item:", fetchError);
            throw fetchError;
          }

          // Check if adding more would exceed stock
          const currentQty = existingItem?.quantity || 0;
          if (product.stock_quantity !== null && currentQty + quantity > product.stock_quantity) {
            toast({
              variant: "destructive",
              title: "Insufficient Stock",
              description: `Only ${product.stock_quantity} items available`,
            });
            return;
          }

          if (existingItem) {
            // Update quantity if item exists
            const { error: updateError } = await supabase
              .from("cart_items")
              .update({ quantity: existingItem.quantity + quantity })
              .eq("id", existingItem.id);

            if (updateError) {
              console.error("Error updating cart item:", updateError);
              throw updateError;
            }
          } else {
            // Insert new item if it doesn't exist
            const { error: insertError } = await supabase
              .from("cart_items")
              .insert([
                {
                  product_id: productId,
                  quantity: quantity,
                  user_id: userInfo.id,
                },
              ]);

            if (insertError) {
              console.error("Error inserting cart item:", insertError);
              throw insertError;
            }
          }

          // Fetch updated cart items
          fetchCartItems();
        } else {
          // Add to localStorage for unauthenticated users
          const storedCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
          const existingItemIndex = storedCart.findIndex(
            (item) => item.product_id === productId
          );
          
          // Check if adding more would exceed stock
          const currentQty = existingItemIndex !== -1 ? storedCart[existingItemIndex].quantity : 0;
          if (product.stock_quantity !== null && currentQty + quantity > product.stock_quantity) {
            toast({
              variant: "destructive",
              title: "Insufficient Stock",
              description: `Only ${product.stock_quantity} items available`,
            });
            return;
          }

          let updatedCart;

          if (existingItemIndex !== -1) {
            // If the item exists, update its quantity
            updatedCart = [...storedCart];
            updatedCart[existingItemIndex].quantity += quantity;
          } else {
            // If the item doesn't exist, add as new
            updatedCart = [
              ...storedCart,
              {
                id: uuidv4(),
                product_id: productId,
                quantity: quantity,
              },
            ];
          }

          localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
          localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
          setCartItems(updatedCart);
        }

        toast({
          title: "Added to cart",
          description: "Item has been added to your cart",
        });
      } catch (error) {
        console.error("Error in addToCart:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add item to cart",
        });
        throw error;
      }
    },
    [isAuthenticated, userInfo, fetchCartItems, toast]
  );

  // Remove item from cart
  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        if (isAuthenticated && userInfo) {
          // Remove from database for authenticated users
          const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("id", itemId);

          if (error) {
            console.error("Error removing cart item:", error);
            throw error;
          }

          // Fetch updated cart items
          fetchCartItems();
        } else {
          // Remove from localStorage for unauthenticated users
          const storedCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
          const updatedCartItems = storedCart.filter(
            (item) => item.id !== itemId
          );

          localStorage.setItem(CART_KEY, JSON.stringify(updatedCartItems));
          localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
          setCartItems(updatedCartItems);
        }

        toast({
          title: "Item Removed",
          description: "Item has been removed from your cart",
        });
      } catch (error) {
        console.error("Error in removeItem:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove item from cart",
        });
        throw error;
      }
    },
    [isAuthenticated, userInfo, fetchCartItems, toast]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      try {
        // Remove item if quantity is 0 or less
        if (newQuantity <= 0) {
          return removeItem(itemId);
        }

        if (isAuthenticated && userInfo) {
          // Update in database for authenticated users
          const { error: updateError } = await supabase
            .from("cart_items")
            .update({ quantity: newQuantity })
            .eq("id", itemId);

          if (updateError) {
            console.error("Error updating cart item:", updateError);
            throw updateError;
          }

          // Fetch updated cart items
          fetchCartItems();
        } else {
          // Update in localStorage for unauthenticated users
          const storedCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
          const updatedCartItems = storedCart.map((item) =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          );

          localStorage.setItem(CART_KEY, JSON.stringify(updatedCartItems));
          localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
          setCartItems(updatedCartItems);
        }

        toast({
          title: "Quantity Updated",
          description: "Item quantity has been updated",
        });
      } catch (error) {
        console.error("Error in updateQuantity:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update item quantity",
        });
        throw error;
      }
    },
    [isAuthenticated, userInfo, fetchCartItems, removeItem, toast]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      if (isAuthenticated && userInfo) {
        // Use userInfo from context instead of making a separate API call
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userInfo.id);

        if (error) {
          console.error("Error clearing cart:", error);
          throw error;
        }
      }

      // Clear localStorage cart
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(CART_TIMESTAMP_KEY);
      setCartItems([]);

      toast({
        title: "Cart Cleared",
        description: "Your cart has been cleared",
      });
    } catch (error) {
      console.error("Error in clearCart:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear cart",
      });
      throw error;
    }
  }, [isAuthenticated, userInfo, toast]);

  // Calculate total price
  const calculateTotal = useCallback((items: CartItem[]) => {
    return items.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  }, []);

  // Context value
  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      isLoading,
      addToCart,
      updateQuantity,
      removeItem,
      calculateTotal,
      clearCart,
    }),
    [
      cartItems,
      cartCount,
      isLoading,
      addToCart,
      updateQuantity,
      removeItem,
      calculateTotal,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
};

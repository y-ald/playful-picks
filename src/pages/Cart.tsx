import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { useProductsData } from "@/hooks/useDataFetching";
import { Skeleton } from "@/components/ui/skeleton";
import CartItemRow from "@/components/CartItemRow";

export default function Cart() {
  const navigate = useNavigate();
  const { language, translations } = useLanguage();
  const {
    cartItems,
    updateQuantity,
    removeItem,
    calculateTotal,
    isLoading: cartLoading,
  } = useCart();

  // Get product IDs from cart items
  const productIds = cartItems.map((item) => item.product_id);

  // Fetch product details for all cart items in a single optimized query
  const { data: products, isLoading: productsLoading } = useProductsData(
    productIds,
    {
      enabled: productIds.length > 0,
      // Don't refetch on window focus to avoid unnecessary requests
      refetchOnWindowFocus: false,
    }
  );

  // Create a map of products by ID for easy lookup
  const productsMap = (products || []).reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

  // Combine cart items with product details
  const cartItemsWithProducts = cartItems.map((item) => ({
    ...item,
    product: productsMap[item.product_id] || null,
  }));

  const isLoading = cartLoading || productsLoading;

  const handleCheckout = () => {
    navigate(`/${language}/checkout`, {
      state: {
        cartItems: cartItemsWithProducts,
        total: calculateTotal(cartItemsWithProducts),
      },
    });
  };

  const handleReturnToShop = () => {
    navigate(`/${language}/shop`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-32 mr-4" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr,300px]">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-24 h-24 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/4 mb-4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div>
            <Card className="p-4">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <div className="flex justify-between mb-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-10 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate(`/${language}/shop`)}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mr-4"
          onClick={handleReturnToShop}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {translations?.cart?.continueShopping || "Return to Shop"}
        </Button>
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr,300px]">
        <div className="space-y-4">
          {cartItemsWithProducts.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="flex justify-between mb-4">
              <span>Total</span>
              <span>${calculateTotal(cartItemsWithProducts).toFixed(2)}</span>
            </div>
            <Button className="w-full" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

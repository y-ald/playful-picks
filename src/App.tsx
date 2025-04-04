
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { lazyLoad } from "./utils/lazyLoad";
import { Loader2 } from "lucide-react";

// Lazy load pages to improve initial loading time
const Index = lazyLoad(() => import("./pages/Index"));
const Shop = lazyLoad(() => import("./pages/Shop"));
const ProductDetails = lazyLoad(() => import("./pages/ProductDetails"));
const Favorites = lazyLoad(() => import("./pages/Favorites"));
const Contact = lazyLoad(() => import("./pages/Contact"));
const NotFound = lazyLoad(() => import("./pages/NotFound"));
const CheckoutSuccess = lazyLoad(() => import("./pages/CheckoutSuccess"));
const Cart = lazyLoad(() => import("./pages/Cart"));
const Checkout = lazyLoad(() => import("./pages/Checkout"));
const About = lazyLoad(() => import("./pages/About"));
const Auth = lazyLoad(() => import("./pages/Auth"));
const TrackingPage = lazyLoad(() => import("./pages/TrackingPage"));

// Lazy load account pages separately
const ProfilePage = lazyLoad(() => import("./pages/account/ProfilePage"));
const AddressesPage = lazyLoad(() => import("./pages/account/AddressesPage"));
const AdminPage = lazyLoad(() => import("./pages/account/AdminPage"));

// Create a new query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (replaces cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Navigate to="/en" replace />} />
            <Route path="/:lang">
              <Route index element={<Index />} />
              <Route path="shop" element={<Shop />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="contact" element={<Contact />} />
              <Route path="about" element={<About />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="checkoutsuccess" element={<CheckoutSuccess />} />
              <Route path="auth" element={<Auth />} />
              <Route path="tracking/:trackingNumber" element={<TrackingPage />} />
              
              {/* Account Settings Routes */}
              <Route path="account" element={<ProfilePage />} />
              <Route path="account/addresses" element={<AddressesPage />} />
              <Route path="account/admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

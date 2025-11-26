
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Auth from './pages/Auth';
import Favorites from './pages/Favorites';
import Contact from './pages/Contact';
import TrackingPage from './pages/TrackingPage';
import ProfilePage from './pages/account/ProfilePage';
import AddressesPage from './pages/account/AddressesPage';
import AdminPage from './pages/account/AdminPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/:lang" element={<Index />} />
      <Route path="/:lang/about" element={<About />} />
      <Route path="/:lang/shop" element={<Shop />} />
      <Route path="/:lang/product/:id" element={<ProductDetails />} />
      <Route path="/:lang/cart" element={<Cart />} />
      <Route path="/:lang/checkout" element={<Checkout />} />
      <Route path="/:lang/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/:lang/auth" element={<Auth />} />
      <Route path="/:lang/favorites" element={<Favorites />} />
      <Route path="/:lang/contact" element={<Contact />} />
      <Route path="/:lang/tracking" element={<TrackingPage />} />
      <Route path="/:lang/account" element={<ProfilePage />} />
      <Route path="/:lang/account/addresses" element={<AddressesPage />} />
      <Route path="/:lang/account/admin/*" element={<AdminPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

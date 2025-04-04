
import { createBrowserRouter } from 'react-router-dom';
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
import { useLanguage } from './contexts/LanguageContext';

const routes = [
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/:lang',
    element: <Index />,
  },
  {
    path: '/:lang/about',
    element: <About />,
  },
  {
    path: '/:lang/shop',
    element: <Shop />,
  },
  {
    path: '/:lang/product/:id',
    element: <ProductDetails />,
  },
  {
    path: '/:lang/cart',
    element: <Cart />,
  },
  {
    path: '/:lang/checkout',
    element: <Checkout />,
  },
  {
    path: '/:lang/checkout/success',
    element: <CheckoutSuccess />,
  },
  {
    path: '/:lang/auth',
    element: <Auth />,
  },
  {
    path: '/:lang/favorites',
    element: <Favorites />,
  },
  {
    path: '/:lang/contact',
    element: <Contact />,
  },
  {
    path: '/:lang/tracking',
    element: <TrackingPage />,
  },
  {
    path: '/:lang/account',
    element: <ProfilePage />,
  },
  {
    path: '/:lang/account/addresses',
    element: <AddressesPage />,
  },
  {
    path: '/:lang/account/admin',
    element: <AdminPage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);

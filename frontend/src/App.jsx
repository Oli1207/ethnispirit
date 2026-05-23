import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';

import useAuthStore from './store/auth';
import useCartStore from './store/cart';
import useTracking from './hooks/useTracking';

// Layout
import Navbar        from './components/Navbar';
import Footer        from './components/Footer';
import BioNavbar     from './components/BioNavbar';
import BioFooter     from './components/BioFooter';
import WelcomeModal  from './components/WelcomeModal';
import PrivateRoute from './layout/PrivateRoute';
import AdminRoute   from './layout/AdminRoute';

// Mode screens
import HomeScreen         from './views/screens/HomeScreen';
import CatalogueScreen    from './views/screens/CatalogueScreen';
import ProductDetailScreen from './views/screens/ProductDetailScreen';
import CartScreen         from './views/screens/CartScreen';
import CheckoutScreen     from './views/screens/CheckoutScreen';
import PaymentSuccessScreen from './views/screens/PaymentSuccessScreen';
import PaymentFailedScreen  from './views/screens/PaymentFailedScreen';
import AccountScreen      from './views/screens/AccountScreen';
import AboutScreen        from './views/screens/AboutScreen';
import ContactScreen      from './views/screens/ContactScreen';

// Bio screens
import BioHomeScreen      from './views/screens/BioHomeScreen';
import BioCatalogueScreen from './views/screens/BioCatalogueScreen';
import BioAboutScreen     from './views/screens/BioAboutScreen';

// Auth screens
import LoginScreen          from './views/auth/LoginScreen';
import RegisterScreen       from './views/auth/RegisterScreen';
import ForgotPasswordScreen from './views/auth/ForgotPasswordScreen';
import ResetPasswordScreen  from './views/auth/ResetPasswordScreen';

// Admin
import AdminDashboard    from './views/admin/AdminDashboard';
import AdminOrders       from './views/admin/AdminOrders';
import AdminProducts     from './views/admin/AdminProducts';
import AdminNewsletter   from './views/admin/AdminNewsletter';
import AdminCategories   from './views/admin/AdminCategories';
import AdminShipping     from './views/admin/AdminShipping';
import AdminPromoCodes   from './views/admin/AdminPromoCodes';
import AdminContacts     from './views/admin/AdminContacts';
import AdminAnalytics    from './views/admin/AdminAnalytics';

import OrderConfirmedScreen  from './views/screens/OrderConfirmedScreen';
import WishlistScreen         from './views/screens/WishlistScreen';
import FAQScreen              from './views/screens/FAQScreen';
import LivraisonScreen        from './views/screens/LivraisonScreen';
import PolicyScreen           from './views/screens/PolicyScreen';
import OrderTrackingScreen    from './views/screens/OrderTrackingScreen';
import ProductRequestPage     from './views/screens/ProductRequestPage';


// ── Tracker de pages vues ─────────────────────────────────────────────────────
function PageTracker() {
  const location = useLocation();
  const { trackEvent } = useTracking();
  useEffect(() => {
    trackEvent('pageview', { page_url: location.pathname + location.search });
  }, [location.pathname]);
  return null;
}

// ── Layouts ────────────────────────────────────────────────────────────────
function ModeLayout() {
  return (
    <>
      <Navbar />
      <WelcomeModal currentUniverse="mode" />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function BioLayout() {
  return (
    <>
      <BioNavbar />
      <WelcomeModal currentUniverse="bio" />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <BioFooter />
    </>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const init      = useAuthStore((s) => s.init);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    init();        // Charge user depuis le JWT (immédiat)
    fetchCart();
  }, []);

  // Enrichit user avec les données complètes de l'API (is_staff, profil, etc.)
  // dès qu'on sait qu'il y a un token valide
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchMe         = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (isAuthenticated) fetchMe();
  }, [isAuthenticated]);

  return (
    <HelmetProvider>
    <BrowserRouter>
      <PageTracker />
      <Routes>
        {/* ── Mode Antillaise ─────────────────────────────────────────────── */}
        <Route element={<ModeLayout />}>
          <Route path="/"                index element={<HomeScreen />} />
          <Route path="/catalogue"       element={<CatalogueScreen />} />
          <Route path="/produit/:slug"   element={<ProductDetailScreen />} />
          <Route path="/panier"          element={<CartScreen />} />
          <Route path="/commande"          element={<CheckoutScreen />} />
          <Route path="/paiement-succes"  element={<PaymentSuccessScreen />} />
          <Route path="/paiement-echec"   element={<PaymentFailedScreen />} />
          {/* Alias anglais — compatibilité */}
          <Route path="/payment-success"  element={<PaymentSuccessScreen />} />
          <Route path="/payment-failed"   element={<PaymentFailedScreen />} />
          <Route path="/commande-confirmee/:oid" element={<OrderConfirmedScreen />} />
          <Route path="/a-propos"        element={<AboutScreen />} />
          <Route path="/contact"         element={<ContactScreen />} />
          <Route path="/faq"             element={<FAQScreen />} />
          <Route path="/livraison"       element={<LivraisonScreen />} />
          <Route path="/politique"          element={<PolicyScreen />} />
          <Route path="/suivi-commande"    element={<OrderTrackingScreen />} />
          <Route path="/ma-demande"        element={<ProductRequestPage />} />

          <Route path="/compte" element={
            <PrivateRoute><AccountScreen /></PrivateRoute>
          } />
          <Route path="/favoris" element={
            <PrivateRoute><WishlistScreen /></PrivateRoute>
          } />

          {/* Auth */}
          <Route path="/login"                element={<LoginScreen />} />
          <Route path="/register"             element={<RegisterScreen />} />
          <Route path="/mot-de-passe-oublie"  element={<ForgotPasswordScreen />} />
          <Route path="/reset-password"       element={<ResetPasswordScreen />} />

          {/* Admin */}
          <Route path="/admin-dashboard" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/admin-dashboard/commandes" element={
            <AdminRoute><AdminOrders /></AdminRoute>
          } />
          <Route path="/admin-dashboard/produits" element={
            <AdminRoute><AdminProducts /></AdminRoute>
          } />
          <Route path="/admin-dashboard/newsletter" element={
            <AdminRoute><AdminNewsletter /></AdminRoute>
          } />
          <Route path="/admin-dashboard/livraison" element={
            <AdminRoute><AdminShipping /></AdminRoute>
          } />
          <Route path="/admin-dashboard/categories" element={
            <AdminRoute><AdminCategories /></AdminRoute>
          } />
          <Route path="/admin-dashboard/promo" element={
            <AdminRoute><AdminPromoCodes /></AdminRoute>
          } />
          <Route path="/admin-dashboard/contacts" element={
            <AdminRoute><AdminContacts /></AdminRoute>
          } />
          <Route path="/admin-dashboard/analytics" element={
            <AdminRoute><AdminAnalytics /></AdminRoute>
          } />
        </Route>

        {/* ── Bio & Naturel ──────────────────────────────────────────────── */}
        <Route path="/bio" element={<BioLayout />}>
          <Route index                  element={<BioHomeScreen />} />
          <Route path="catalogue"       element={<BioCatalogueScreen />} />
          <Route path="produit/:slug"   element={<ProductDetailScreen />} />
          <Route path="a-propos"        element={<BioAboutScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </HelmetProvider>
  );
}

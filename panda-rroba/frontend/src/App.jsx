import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import ShopLayout from './components/ShopLayout';
import HomePage from './pages/shop/HomePage';
import CatalogPage from './pages/shop/CatalogPage';
import ProductPage from './pages/shop/ProductPage';
import CartPage from './pages/shop/CartPage';
import CheckoutPage from './pages/shop/CheckoutPage';
import OrderDonePage from './pages/shop/OrderDonePage';
import TrackPage from './pages/shop/TrackPage';
import InfoPage from './pages/shop/InfoPage';
import SavedPage from './pages/shop/SavedPage';
import AccountPage from './pages/shop/AccountPage';
import AboutPage from './pages/shop/AboutPage';
import PaymentPage from './pages/shop/PaymentPage';
import TermsPage from './pages/shop/TermsPage';
import SubscribersPage from './pages/admin/SubscribersPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import CustomersPage from './pages/admin/CustomersPage';
import AdminLayout from './pages/admin/AdminLayout';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import ProductsPage from './pages/admin/ProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import PurchaseListPage from './pages/admin/PurchaseListPage';
import ShipmentsPage from './pages/admin/ShipmentsPage';
import ShipmentDetailPage from './pages/admin/ShipmentDetailPage';
import SettingsPage from './pages/admin/SettingsPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function NotFound() {
  return <div className="container section empty"><h1>Faqja nuk u gjet</h1></div>;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<ShopLayout />}>
          <Route index element={<HomePage />} />
          <Route path="dyqani" element={<CatalogPage />} />
          <Route path="produkt/:slug" element={<ProductPage />} />
          <Route path="shporta" element={<CartPage />} />
          <Route path="porosit" element={<CheckoutPage />} />
          <Route path="porosia-u-krye" element={<OrderDonePage />} />
          <Route path="pagesa" element={<PaymentPage />} />
          <Route path="gjurmo" element={<TrackPage />} />
          <Route path="info" element={<InfoPage />} />
          <Route path="te-ruajturat" element={<SavedPage />} />
          <Route path="llogaria" element={<AccountPage />} />
          <Route path="rreth-nesh" element={<AboutPage />} />
          <Route path="kushtet" element={<TermsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/hyr" element={<LoginPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="porosite" element={<OrdersPage />} />
          <Route path="porosite/:id" element={<OrderDetailPage />} />
          <Route path="produktet" element={<ProductsPage />} />
          <Route path="produktet/:id" element={<ProductFormPage />} />
          <Route path="per-te-blere" element={<PurchaseListPage />} />
          <Route path="dergesat" element={<ShipmentsPage />} />
          <Route path="dergesat/:id" element={<ShipmentDetailPage />} />
          <Route path="cilesimet" element={<SettingsPage />} />
          <Route path="kryefaqja" element={<SettingsPage />} />
          <Route path="abonentet" element={<SubscribersPage />} />
          <Route path="kategorite" element={<CategoriesPage />} />
          <Route path="klientet" element={<CustomersPage />} />
        </Route>
      </Routes>
    </>
  );
}

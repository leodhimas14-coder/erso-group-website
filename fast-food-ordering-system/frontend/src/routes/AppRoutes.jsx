import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import KioskPage from '../features/kiosk/KioskPage.jsx';
import KitchenDisplayPage from '../features/kitchen/KitchenDisplayPage.jsx';
import CashierDashboardPage from '../features/cashier/CashierDashboardPage.jsx';
import AdminPanelPage from '../features/admin/AdminPanelPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Customer-facing kiosk/website ordering is public - no login needed */}
      <Route path="/" element={<KioskPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/kitchen"
        element={
          <ProtectedRoute roles={['admin', 'kitchen']}>
            <KitchenDisplayPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cashier"
        element={
          <ProtectedRoute roles={['admin', 'cashier']}>
            <CashierDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminPanelPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

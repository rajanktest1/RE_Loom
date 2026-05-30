import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { RegisterPage } from '@/modules/auth/pages/RegisterPage';
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage';
import { InventoryPage } from '@/modules/inventory/pages/InventoryPage';
import { SupplyChainPage } from '@/modules/supply-chain/pages/SupplyChainPage';
import { CRMPage } from '@/modules/crm/pages/CRMPage';
import { SAdminPage } from '@/modules/s-admin/pages/SAdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="inventory/*" element={<InventoryPage />} />
        <Route path="supply-chain/*" element={<SupplyChainPage />} />
        <Route path="crm/*" element={<CRMPage />} />
        <Route path="s-admin" element={<SAdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

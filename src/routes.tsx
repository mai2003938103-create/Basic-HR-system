import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { useAuth } from './auth/useAuth';
import { homePath } from './lib/permissions';
import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';

function Home() {
  const { can } = useAuth();
  const to = homePath(can);
  return to === '/' ? <div className="p-6 text-page-title">Systory HRMS</div> : <Navigate to={to} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      <Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    </Routes>
  );
}

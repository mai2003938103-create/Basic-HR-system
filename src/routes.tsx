import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { useAuth } from './auth/useAuth';
import { homePath } from './lib/permissions';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';

function Home() {
  const { can } = useAuth();
  const to = homePath(can);
  return to === '/' ? <div className="text-page-title">Systory HRMS</div> : <Navigate to={to} replace />;
}

function NotFound() {
  const { t } = useTranslation();
  return <p className="py-24 text-center text-subhead">{t('errors.notFoundPage')}</p>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

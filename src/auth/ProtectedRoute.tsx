import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './useAuth';
import { LoadingState } from '../components/common/LoadingState';

export function ForbiddenPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <ShieldAlert className="size-10 text-ink-muted" aria-hidden />
      <p className="text-subhead">{t('errors.forbiddenPage')}</p>
    </div>
  );
}

export function ProtectedRoute({ children, permission }: { children: ReactNode; permission?: string }) {
  const { status, user, can } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingState fullPage />;
  if (status === 'anonymous' || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  if (permission && !can(permission)) return <ForbiddenPage />;
  return <>{children}</>;
}

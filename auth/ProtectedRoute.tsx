'use client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './useAuth';
import { LoadingState } from '../components/common/LoadingState';
import { Navigate, useLocation } from '@/lib/router';

export function ForbiddenPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <ShieldAlert className="size-10 text-ink-muted" aria-hidden />
      <p className="text-subhead">{t('errors.forbiddenPage')}</p>
    </div>
  );
}

/** Signed-in area: sends anonymous visitors to /login?from=<this page> and forces a first-login password change. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const { pathname, search } = useLocation();
  if (status === 'loading') return <LoadingState fullPage />;
  if (status === 'anonymous' || !user) return <Navigate to={`/login?from=${encodeURIComponent(pathname + search)}`} replace />;
  if (user.mustChangePassword && pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

/** Shows the page only with `permission`; otherwise a "no access" message. */
export function RequirePermission({ children, permission }: { children: ReactNode; permission: string }) {
  const { can } = useAuth();
  if (!can(permission)) return <ForbiddenPage />;
  return <>{children}</>;
}

/** RequireAuth + optional permission in one wrapper (used by tests and simple pages). */
export function ProtectedRoute({ children, permission }: { children: ReactNode; permission?: string }) {
  return <RequireAuth>{permission ? <RequirePermission permission={permission}>{children}</RequirePermission> : children}</RequireAuth>;
}

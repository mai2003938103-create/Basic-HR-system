'use client';
import { useAuth } from '@/auth/useAuth';
import { Navigate } from '@/lib/router';
import { homePath } from '@/lib/permissions';
import { DashboardPage } from '@/screens/dashboard/DashboardPage';

/** "/" shows the dashboard to those who may see it; everyone else goes to their own start page. */
export default function Home() {
  const { can } = useAuth();
  const to = homePath(can);
  return to === '/' ? <DashboardPage /> : <Navigate to={to} replace />;
}

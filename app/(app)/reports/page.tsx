'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { ReportsPage } from '@/screens/reports/ReportsPage';

export default function Page() {
  return (
    <RequirePermission permission="report.view">
      <ReportsPage />
    </RequirePermission>
  );
}

'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { PayRunPage } from '@/screens/payroll/PayRunPage';

export default function Page() {
  return (
    <RequirePermission permission="payroll.read">
      <PayRunPage />
    </RequirePermission>
  );
}

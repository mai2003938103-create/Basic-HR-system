'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { PayrollPage } from '@/screens/payroll/PayrollPage';

export default function Page() {
  return (
    <RequirePermission permission="payroll.read">
      <PayrollPage />
    </RequirePermission>
  );
}

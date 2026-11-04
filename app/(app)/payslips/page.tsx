'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { PayslipsPage } from '@/screens/payroll/PayslipsPage';

export default function Page() {
  return (
    <RequirePermission permission="payslip.self">
      <PayslipsPage />
    </RequirePermission>
  );
}

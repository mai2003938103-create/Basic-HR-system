'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { EmployeeDetailPage } from '@/screens/employees/EmployeeDetailPage';

export default function Page() {
  return (
    <RequirePermission permission="employee.read">
      <EmployeeDetailPage />
    </RequirePermission>
  );
}

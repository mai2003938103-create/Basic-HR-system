'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { EmployeesPage } from '@/screens/employees/EmployeesPage';

export default function Page() {
  return (
    <RequirePermission permission="employee.read">
      <EmployeesPage />
    </RequirePermission>
  );
}

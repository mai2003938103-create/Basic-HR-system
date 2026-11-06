'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { EmployeeFormPage } from '@/screens/employees/EmployeeFormPage';

export default function Page() {
  return (
    <RequirePermission permission="employee.create">
      <EmployeeFormPage />
    </RequirePermission>
  );
}

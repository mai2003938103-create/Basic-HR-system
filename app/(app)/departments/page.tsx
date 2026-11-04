'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { DepartmentsPage } from '@/screens/departments/DepartmentsPage';

export default function Page() {
  return (
    <RequirePermission permission="department.read">
      <DepartmentsPage />
    </RequirePermission>
  );
}

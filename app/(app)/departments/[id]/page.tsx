'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { DepartmentDetailPage } from '@/screens/departments/DepartmentDetailPage';

export default function Page() {
  return (
    <RequirePermission permission="department.read">
      <DepartmentDetailPage />
    </RequirePermission>
  );
}

'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { RolesPage } from '@/screens/users/RolesPage';

export default function Page() {
  return (
    <RequirePermission permission="role.manage">
      <RolesPage />
    </RequirePermission>
  );
}

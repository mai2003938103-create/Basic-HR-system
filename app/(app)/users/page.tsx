'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { UsersPage } from '@/screens/users/UsersPage';

export default function Page() {
  return (
    <RequirePermission permission="user.read">
      <UsersPage />
    </RequirePermission>
  );
}

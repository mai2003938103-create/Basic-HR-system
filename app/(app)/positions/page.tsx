'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { PositionsPage } from '@/screens/positions/PositionsPage';

export default function Page() {
  return (
    <RequirePermission permission="position.read">
      <PositionsPage />
    </RequirePermission>
  );
}

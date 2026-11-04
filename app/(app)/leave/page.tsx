'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { LeavePage } from '@/screens/leave/LeavePage';

export default function Page() {
  return (
    <RequirePermission permission="leave.read">
      <LeavePage />
    </RequirePermission>
  );
}

'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { AttendancePage } from '@/screens/attendance/AttendancePage';

export default function Page() {
  return (
    <RequirePermission permission="attendance.read">
      <AttendancePage />
    </RequirePermission>
  );
}

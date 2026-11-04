'use client';
import { RequirePermission } from '@/auth/ProtectedRoute';
import { SettingsPage } from '@/screens/settings/SettingsPage';

export default function Page() {
  return (
    <RequirePermission permission="settings.manage">
      <SettingsPage />
    </RequirePermission>
  );
}

'use client';
import type { ReactNode } from 'react';
import { RequireAuth } from '@/auth/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';

export default function SignedInLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppLayout>{children}</AppLayout>
    </RequireAuth>
  );
}

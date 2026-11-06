'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import '../i18n';
import { AuthProvider } from '../auth/AuthProvider';

/**
 * The app runs in the browser: data comes from the Express API with the signed-in user's token,
 * so nothing is rendered on the server (language, session and theme live in the browser).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}

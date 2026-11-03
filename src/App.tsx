import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthProvider';
import { AppRoutes } from './routes';

const PROTOTYPE = import.meta.env.VITE_PROTOTYPE === '1';
// The hosted prototype runs in a sandboxed frame where URL paths and hash paths do not persist.
function Router({ children }: { children: ReactNode }) {
  if (!PROTOTYPE) return <BrowserRouter>{children}</BrowserRouter>;
  // A `#/path` in a local copy opens that screen first (handy for review links and tests).
  const start = typeof location !== 'undefined' && location.hash.startsWith('#/') ? location.hash.slice(1) : '/';
  return <MemoryRouter initialEntries={[start]}>{children}</MemoryRouter>;
}
const PrototypeBar = PROTOTYPE ? lazy(() => import('./prototype/PrototypeBar')) : null;

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
        {PrototypeBar && <Suspense fallback={null}><PrototypeBar /></Suspense>}
      </AuthProvider>
    </Router>
  );
}

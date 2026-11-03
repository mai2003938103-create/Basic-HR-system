import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '../auth/AuthProvider';

/** Renders `ui` at `route` inside the app providers; `routes` adds sibling routes for navigation assertions. */
export function renderApp(ui: ReactElement, { route = '/', path = '*', routes = [] as { path: string; element: ReactElement }[] } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={ui} />
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Routes>
        <Toaster />
      </AuthProvider>
    </MemoryRouter>,
  );
}

import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '../auth/AuthProvider';
import { ParamsContext, navigation, useHref } from './navigation';

type Entry = { path: string; element: ReactElement };

/** react-router style patterns: '*', '/employees/:id', 'employees/new'. */
function match(pattern: string, pathname: string): Record<string, string> | null {
  if (pattern === '*') return {};
  const p = pattern.replace(/^\//, '').split('/');
  const s = pathname.replace(/^\//, '').split('/');
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

function TestRoutes({ entries }: { entries: Entry[] }) {
  const { pathname } = new URL(useHref());
  // Exact patterns win over the '*' catch-all, as in react-router.
  for (const e of [...entries.filter((x) => x.path !== '*'), ...entries.filter((x) => x.path === '*')]) {
    const params = match(e.path, pathname);
    if (params) return <ParamsContext.Provider value={params}>{e.element}</ParamsContext.Provider>;
  }
  return null;
}

/** Renders `ui` at `route` inside the app providers; `routes` adds sibling pages for navigation assertions. */
export function renderApp(ui: ReactElement, { route = '/', path = '*', routes = [] as Entry[] } = {}) {
  navigation.reset(route);
  return render(
    <AuthProvider>
      <TestRoutes entries={[{ path, element: ui }, ...routes]} />
      <Toaster />
    </AuthProvider>,
  );
}

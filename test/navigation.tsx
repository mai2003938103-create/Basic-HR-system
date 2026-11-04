// In-memory stand-ins for next/navigation and next/link, so screens can be tested without a Next.js server.
import { createContext, forwardRef, useContext, useMemo, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

let url = new URL('http://localhost/');
let history: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const navigation = {
  get pathname() {
    return url.pathname;
  },
  get search() {
    return url.search;
  },
  reset(to: string) {
    url = new URL(to, 'http://localhost/');
    history = [url.href];
    emit();
  },
  push(to: string) {
    url = new URL(to, url);
    history.push(url.href);
    emit();
  },
  replace(to: string) {
    url = new URL(to, url);
    history[history.length - 1] = url.href;
    emit();
  },
  back() {
    if (history.length > 1) history.pop();
    url = new URL(history[history.length - 1] ?? 'http://localhost/');
    emit();
  },
};

export const useHref = () => useSyncExternalStore(subscribe, () => url.href);

/** Route params for the element being rendered (filled by the test router in render.tsx). */
export const ParamsContext = createContext<Record<string, string>>({});

const router = {
  push: (to: string) => navigation.push(to),
  replace: (to: string) => navigation.replace(to),
  back: () => navigation.back(),
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
};

export const nextNavigationMock = {
  useRouter: () => router,
  usePathname: () => new URL(useHref()).pathname,
  useSearchParams: () => {
    const search = new URL(useHref()).search;
    return useMemo(() => new URLSearchParams(search), [search]);
  },
  useParams: () => useContext(ParamsContext),
  redirect: (to: string) => navigation.replace(to),
  notFound: () => {
    throw new Error('notFound');
  },
};

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; replace?: boolean; prefetch?: boolean; scroll?: boolean };
const MockLink = forwardRef<HTMLAnchorElement, LinkProps>(function MockLink({ href, replace, prefetch: _p, scroll: _s, onClick, ...rest }, ref) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    if (replace) navigation.replace(href);
    else navigation.push(href);
  };
  return <a ref={ref} href={href} onClick={go} {...rest} />;
});

export const nextLinkMock = { __esModule: true, default: MockLink };

'use client';
// Small routing helpers on top of Next.js App Router (next/navigation + next/link).
// Screens use these so links, redirects and URL search state read the same everywhere.
import NextLink from 'next/link';
import { useParams as useNextParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation';
import { forwardRef, useCallback, useEffect, useMemo, type AnchorHTMLAttributes, type ReactNode } from 'react';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; replace?: boolean; children?: ReactNode };

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, replace, ...rest }, ref) {
  return <NextLink ref={ref} href={to} replace={replace} {...rest} />;
});

type NavLinkProps = Omit<LinkProps, 'className'> & { end?: boolean; className?: string | ((s: { isActive: boolean }) => string) };

/** Link that knows whether it points at the current page (`end` = exact match only). */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink({ to, end, className, ...rest }, ref) {
  const pathname = usePathname() ?? '/';
  const isActive = end || to === '/' ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <NextLink
      ref={ref}
      href={to}
      aria-current={isActive ? 'page' : undefined}
      className={typeof className === 'function' ? className({ isActive }) : className}
      {...rest}
    />
  );
});

/** navigate('/x'), navigate('/x', { replace: true }) or navigate(-1). */
export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string | number, opts?: { replace?: boolean }) => {
      if (typeof to === 'number') return router.back();
      if (opts?.replace) router.replace(to);
      else router.push(to);
    },
    [router],
  );
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return (useNextParams() ?? {}) as T;
}

export function useLocation() {
  const pathname = usePathname() ?? '/';
  const sp = useNextSearchParams();
  const qs = sp?.toString() ?? '';
  return { pathname, search: qs ? `?${qs}` : '' };
}

type SearchUpdate = URLSearchParams | ((prev: URLSearchParams) => URLSearchParams);

/** [params, setParams] — setParams replaces (or pushes) the URL's query on the current page. */
export function useSearchParams(): [URLSearchParams, (next: SearchUpdate, opts?: { replace?: boolean }) => void] {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const qs = useNextSearchParams()?.toString() ?? '';
  // One URLSearchParams object per query string, so effects that depend on it do not re-run every render.
  const params = useMemo(() => new URLSearchParams(qs), [qs]);
  const set = useCallback(
    (next: SearchUpdate, opts?: { replace?: boolean }) => {
      const value = typeof next === 'function' ? next(new URLSearchParams(qs)) : next;
      const q = value.toString();
      const url = q ? `${pathname}?${q}` : pathname;
      if (opts?.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router, pathname, qs],
  );
  return [params, set];
}

/** Redirects once rendered (client side). */
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [router, to, replace]);
  return null;
}

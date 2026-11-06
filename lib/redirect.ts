/**
 * Where to go after sign-in from a `?from=` value: a path on this site only (with its query), never another
 * site and never the sign-in page itself. Returns null when the value is not safe.
 */
export function safeReturnPath(from: string | null | undefined): string | null {
  if (!from || !from.startsWith('/') || /[\\\u0000-\u001f]/.test(from) || /%5c/i.test(from)) return null;
  const base = 'http://this.site';
  let u: URL;
  try {
    u = new URL(from, base);
  } catch {
    return null;
  }
  if (u.origin !== base) return null;
  if (u.pathname === '/login' || u.pathname.startsWith('/login/')) return null;
  return u.pathname + u.search;
}

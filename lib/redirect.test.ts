import { safeReturnPath } from './redirect';

// Final review finding 2: ?from= must never send people to another site.
describe('safeReturnPath', () => {
  it('keeps same-site paths with their query', () => {
    expect(safeReturnPath('/leave?tab=mine')).toBe('/leave?tab=mine');
    expect(safeReturnPath('/employees/abc')).toBe('/employees/abc');
  });

  it('refuses anything that leaves the site or loops back to sign-in', () => {
    for (const bad of ['//evil.com', '/\\evil.com', '/%5Cevil.com', '/\t/evil.com', 'https://evil.com/x', 'javascript:alert(1)', '/login', '/login?from=/x', '', null]) {
      expect(safeReturnPath(bad as string | null)).toBeNull();
    }
  });
});

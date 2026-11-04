import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, onSession, refreshSession, setAccessToken } from '../lib/api';
import type { MeDto } from './types';

export interface AuthState {
  user: MeDto | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (email: string, password: string) => Promise<MeDto>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
  reload: () => Promise<void>;
  /** True after the user signed out on purpose (then sign-in should not offer to return to the last page). */
  signedOut: boolean;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeDto | null>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    onSession((s) => {
      setUser((s?.user as MeDto) ?? null);
      setStatus(s ? 'authenticated' : 'anonymous');
    });
    void refreshSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post('/auth/login', { email, password });
    setAccessToken(r.data.data.accessToken);
    setUser(r.data.data.user);
    setSignedOut(false);
    setStatus('authenticated');
    return r.data.data.user as MeDto;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
      setSignedOut(true);
      setStatus('anonymous');
    }
  }, []);

  const reload = useCallback(async () => {
    const r = await api.get('/auth/me');
    setUser(r.data.data);
  }, []);

  const perms = useMemo(() => new Set(user?.permissions ?? []), [user]);
  const can = useCallback((p: string) => perms.has(p), [perms]);

  const value = useMemo(() => ({ user, status, login, logout, can, reload, signedOut }), [user, status, login, logout, can, reload, signedOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

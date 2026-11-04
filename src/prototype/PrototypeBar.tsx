import { ChevronUp, FlaskConical, RotateCcw, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/ui/button';
import { homePath } from '../lib/permissions';
import { cn } from '@/lib/utils';
import { resetDb } from './db';

const ACCOUNTS = [
  { key: 'superAdmin', email: 'admin@systory.la' },
  { key: 'hr', email: 'emp0001@systory.la' },
  { key: 'director', email: 'director@systory.la' },
  { key: 'manager', email: 'emp0006@systory.la' },
  { key: 'employee', email: 'emp0008@systory.la' },
];
const BAR = 40; // px, reserved at the bottom of the page so the strip never covers content

/**
 * Prototype-only strip pinned to the bottom edge: says this is sample data and opens the
 * role switcher. The page gets matching bottom padding, so no screen content sits under it.
 */
export default function PrototypeBar() {
  const { t } = useTranslation();
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const onLogin = location.pathname === '/login';
  const current = ACCOUNTS.find((a) => a.email === user?.email);

  useEffect(() => {
    // Reserve the strip's height: full-height layouts shrink by it and the page gets bottom padding.
    const reserve = `calc(${BAR}px + env(safe-area-inset-bottom, 0px))`;
    const style = document.createElement('style');
    style.textContent = `body{padding-bottom:${reserve}}.min-h-screen{min-height:calc(100vh - ${reserve})}.h-screen{height:calc(100vh - ${reserve})}`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: PointerEvent) => { if (!panelRef.current?.parentElement?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  const switchTo = async (email: string) => {
    try {
      if (user) await logout();
      const me = await login(email, 'Demo1234');
      navigate(homePath((p) => me.permissions.includes(p)), { replace: true });
      setOpen(false);
    } catch {
      toast.error(t('errors.common.internal'));
    }
  };

  return (
    <div className="print:hidden">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t('prototype.title')}
          className="fixed z-[45] w-80 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-surface-card p-4 shadow-overlay"
          style={{ bottom: `calc(${BAR + 8}px + env(safe-area-inset-bottom, 0px))`, right: 'max(16px, env(safe-area-inset-right, 0px))' }}
        >
          <div className="mb-1 flex items-start justify-between gap-2">
            <p className="text-subhead">{t('prototype.title')}</p>
            <Button variant="ghost" size="iconSm" aria-label={t('common.close')} onClick={() => setOpen(false)}><X /></Button>
          </div>
          <p className="mb-3 text-body-sm text-ink-muted">{t('prototype.note')}</p>
          <p className="mb-2 text-caption uppercase text-ink-muted">{t('prototype.switchRole')}</p>
          <ul className="mb-3 flex flex-col gap-1">
            {ACCOUNTS.map((a) => {
              const active = user?.email === a.email;
              return (
                <li key={a.key}>
                  <button
                    type="button"
                    onClick={() => switchTo(a.email)}
                    aria-current={active || undefined}
                    className={cn('flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring', active && 'bg-primary-tint')}
                  >
                    <UserRound className="size-4 shrink-0 text-primary-hover" />
                    <span className="min-w-0">
                      <span className="block text-label">{t(`prototype.roles.${a.key}`)}</span>
                      <span className="block truncate text-body-sm text-ink-muted">{a.email}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mb-3 text-body-sm text-ink-muted">{t('prototype.password')}</p>
          <Button variant="outline" size="sm" onClick={async () => { resetDb(); if (user) await logout(); toast.success(t('prototype.resetDone')); navigate('/login', { replace: true }); }}>
            <RotateCcw /> {t('prototype.reset')}
          </Button>
        </div>
      )}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-ink text-surface-card"
        style={{ height: `calc(${BAR}px + env(safe-area-inset-bottom, 0px))`, paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(8px, env(safe-area-inset-right, 0px))' }}
      >
        <p className="flex min-w-0 items-center gap-2 text-body-sm">
          <FlaskConical className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{t('prototype.badge')}{current ? ` · ${t(`prototype.roles.${current.key}`)}` : ''}</span>
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-pill px-3 text-label focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-card', onLogin && !user ? 'bg-primary text-on-primary hover:bg-primary-hover' : 'text-surface-card hover:bg-white/10')}
        >
          {onLogin && !user ? t('prototype.pickAccount') : t('prototype.switchRole')}
          <ChevronUp className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </div>
    </div>
  );
}

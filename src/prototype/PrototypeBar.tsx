import { FlaskConical, RotateCcw, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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

/** Floating panel shown only in the clickable prototype: switch demo roles and reset sample data. */
export default function PrototypeBar() {
  const { t } = useTranslation();
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(location.pathname === '/login');
  // Open on the sign-in screen as a guide; tuck away once inside the app.
  useEffect(() => setOpen(location.pathname === '/login'), [location.pathname]);

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
    <div className="fixed bottom-4 left-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-start gap-2 print:hidden">
      {open && (
        <div role="dialog" aria-label={t('prototype.title')} className="w-80 max-w-full rounded-md border border-border bg-surface-card p-4 shadow-overlay">
          <div className="mb-1 flex items-start justify-between gap-2">
            <p className="text-subhead">{t('prototype.title')}</p>
            <Button variant="ghost" size="iconSm" aria-label={t('common.close')} onClick={() => setOpen(false)}><X /></Button>
          </div>
          <p className="mb-3 text-body-sm text-ink-muted">{t('prototype.note')}</p>
          <p className="mb-2 text-caption uppercase text-ink-muted">{t('prototype.switchRole')}</p>
          <ul className="mb-3 flex flex-col gap-1">
            {ACCOUNTS.map((a) => {
              const current = user?.email === a.email;
              return (
                <li key={a.key}>
                  <button
                    type="button"
                    onClick={() => switchTo(a.email)}
                    aria-current={current || undefined}
                    className={cn('flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring', current && 'bg-primary-tint')}
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
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-pill bg-ink px-4 py-2 text-label text-surface-card shadow-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <FlaskConical className="size-4" /> {t('prototype.badge')}
      </button>
    </div>
  );
}

import { Bell, KeyRound, LogOut, Menu, Moon, Sun, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from '@/lib/router';
import { useAuth } from '../../auth/useAuth';
import { api, type Page } from '../../lib/api';
import { formatDate, formatDateTime, fullName } from '../../lib/format';
import { NAV_ITEMS } from '../../lib/permissions';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { LanguageSwitch } from './LanguageSwitch';

interface Notice {
  id: string;
  type: string;
  titleKey: string;
  data: Record<string, string> | null;
  readAt: string | null;
  createdAt: string;
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('hrms_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('hrms_theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))] as const;
}

function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const load = async () => {
    try {
      const r = await api.get<Page<Notice> & { unread: number }>('/notifications', { params: { pageSize: 10 } });
      setItems(r.data.data);
      setUnread(r.data.unread);
    } catch {
      /* the bell stays quiet when the request fails */
    }
  };
  useEffect(() => {
    void load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const open = async (n: Notice) => {
    if (!n.readAt) await api.put(`/notifications/${n.id}/read`).catch(() => undefined);
    void load();
    if (n.type.startsWith('leave.')) navigate(n.type === 'leave.requested' ? '/leave?tab=approvals' : '/leave');
    else if (n.type.startsWith('payroll.') && n.data?.payRunId) navigate(`/payroll/${n.data.payRunId}`);
    else if (n.type === 'payslip.ready') navigate('/payslips');
  };
  const fmt = (d: Record<string, string> | null) => ({ ...d, startDate: formatDate(d?.startDate), endDate: formatDate(d?.endDate) });

  return (
    <Popover onOpenChange={(o) => o && void load()}>
      <PopoverTrigger asChild>
        <Button variant="subtle" size="icon" aria-label={`${t('common.notifications')}${unread ? ` (${unread} ${t('common.unread')})` : ''}`} className="relative">
          <Bell />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-[18px] place-items-center rounded-pill bg-danger px-1 text-caption text-on-danger">{unread > 9 ? '9+' : unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-subhead">{t('common.notifications')}</span>
          {unread > 0 && (
            <button type="button" className="text-body-sm text-primary-hover hover:underline" onClick={async () => { await api.put('/notifications/read-all'); void load(); }}>
              {t('common.markAllRead')}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-body-sm text-ink-muted">{t('common.noNotifications')}</p>
        ) : (
          <ul className="max-h-[360px] overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => open(n)} className={cn('flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-surface-sunken', !n.readAt && 'bg-primary-tint/60')}>
                  <span className="text-body-sm">{t(n.titleKey, fmt(n.data))}</span>
                  <span className="text-caption font-normal text-ink-muted">{formatDateTime(n.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** The sidebar entry for the current path (longest matching prefix), so the header names the page you are on. */
function currentNavKey(pathname: string) {
  const match = NAV_ITEMS.filter((i) => (i.to === '/' ? pathname === '/' : pathname === i.to || pathname.startsWith(`${i.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match?.key;
}

export function Header({ onMenu }: { onMenu: () => void }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();
  const { pathname } = useLocation();
  const pageKey = currentNavKey(pathname);
  const name = user?.employee ? fullName(user.employee) : user?.email;
  const initials = (user?.employee?.firstName ?? user?.email ?? '?').slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface-card px-4 md:px-6">
      <Button variant="subtle" size="icon" className="md:hidden" aria-label={t('common.openMenu')} onClick={onMenu}>
        <Menu />
      </Button>
      <p className="min-w-0 flex-1 truncate text-section-title">{pageKey ? t(`nav.${pageKey}`) : null}</p>
      <LanguageSwitch className="hidden sm:inline-flex" />
      <Button variant="subtle" size="icon" aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')} onClick={toggleTheme}>
        {theme === 'dark' ? <Sun /> : <Moon />}
      </Button>
      <Notifications />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-2 rounded-pill py-1 pl-1 pr-3 hover:bg-surface-sunken" aria-label={t('common.user')}>
            <span className="grid size-8 place-items-center rounded-pill bg-accent-tint text-label font-semibold text-accent">{initials}</span>
            <span className="hidden max-w-[160px] truncate text-label sm:inline">{name}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to="/profile"><UserRound />{t('common.profile')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/change-password"><KeyRound />{t('common.changePassword')}</Link>
          </DropdownMenuItem>
          <div className="px-3 py-2 sm:hidden"><LanguageSwitch /></div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={async () => { await logout(); navigate('/login', { replace: true }); }}>
            <LogOut />{t('common.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/systory-logo.jpg';
import { cn } from '@/lib/utils';
import { visibleNav } from '../../lib/permissions';

/** Navigation list: pills on the brand gradient; the active item is a white pill. */
export function SidebarNav({ can, collapsed = false, onNavigate, badges = {} }: { can: (p: string) => boolean; collapsed?: boolean; onNavigate?: () => void; badges?: Record<string, number> }) {
  const { t } = useTranslation();
  const items = visibleNav(can);
  const main = items.filter((i) => !i.section && i.key !== 'profile');
  const system = items.filter((i) => i.section === 'system');
  const tail = items.filter((i) => i.key === 'profile');

  const link = (i: (typeof items)[number]) => (
    <NavLink
      key={i.key}
      to={i.to}
      end={i.to === '/'}
      data-key={i.key}
      title={collapsed ? t(`nav.${i.key}`) : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center gap-3 rounded-pill px-3 text-label transition-colors focus-visible:outline-on-secondary',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-surface-card font-semibold text-primary-hover' : 'text-on-secondary-muted hover:bg-white/10 hover:text-on-secondary',
        )
      }
    >
      <span className="relative shrink-0">
        <i.icon className="size-5" aria-hidden />
        {collapsed && badges[i.key] ? <span aria-hidden className="absolute -right-1 -top-1 size-2.5 rounded-full bg-warning ring-2 ring-secondary" /> : null}
      </span>
      <span className={cn('flex-1', collapsed && 'sr-only')}>{t(`nav.${i.key}`)}</span>
      {badges[i.key] ? (
        <span className={cn('tabular rounded-pill bg-warning-tint px-2 text-caption text-warning-text', collapsed && 'sr-only')}>
          {badges[i.key]}<span className="sr-only"> {t('dashboard.waitingForYou')}</span>
        </span>
      ) : null}
    </NavLink>
  );

  return (
    <nav aria-label={t('common.menu')} className="flex flex-col gap-1">
      {main.map(link)}
      {system.length > 0 && <div className={cn('px-3 pb-1 pt-3 text-caption text-on-secondary-muted', collapsed && 'sr-only')}>{t('nav.system')}</div>}
      {system.map(link)}
      {tail.length > 0 && <div className="my-2 h-px bg-white/15" />}
      {tail.map(link)}
    </nav>
  );
}

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center gap-3 px-2 pb-4 pt-2', collapsed && 'justify-center px-0')}>
      <img src={logo} alt="Systory" className="size-10 shrink-0 rounded-sm bg-white object-contain" />
      {!collapsed && (
        <span className="min-w-0">
          <b className="block truncate text-[15px] leading-5 text-on-secondary">{t('nav.productName')}</b>
          <small className="block truncate text-caption font-normal text-on-secondary-muted">{t('nav.productTagline')}</small>
        </span>
      )}
    </div>
  );
}

/** Desktop/tablet sidebar: full at ≥1024px, icons only 768–1023px, hidden below (drawer instead). */
export function Sidebar({ can, badges }: { can: (p: string) => boolean; badges?: Record<string, number> }) {
  return (
    <aside className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto bg-brand p-4 md:flex md:w-[72px] lg:w-[248px]">
      <div className="lg:hidden">
        <Brand collapsed />
        <SidebarNav can={can} collapsed badges={badges} />
      </div>
      <div className="hidden lg:block">
        <Brand />
        <SidebarNav can={can} badges={badges} />
      </div>
    </aside>
  );
}

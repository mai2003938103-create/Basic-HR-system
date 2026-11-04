import type { ReactNode } from 'react';
import { Link } from '@/lib/router';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../../auth/useAuth';

export function PageHeader({ title, actions, subtitle }: { title: string; actions?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-page-title">{title}</h1>
        {subtitle && <p className="text-body-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Design System SectionTab: teal tab flush on the card's left edge. */
export function SectionTab({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded-r-pill bg-primary py-2 pl-6 pr-8 text-subhead text-on-primary">{children}</span>;
}

export function PermissionGate({ permission, children, fallback = null }: { permission: string; children: ReactNode; fallback?: ReactNode }) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}

/** Money for a StatCard: the amount stays on one line and the symbol drops to label size. */
export function MoneyValue({ amount, symbol }: { amount: number; symbol: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-[26px] leading-[38px]">{Math.round(amount).toLocaleString('en-US')}</span>
      <span className="ml-1 text-label">{symbol}</span>
    </span>
  );
}

/** Design System StatCard; `featured` takes the brand gradient (one per dashboard). */
export function DashboardCard({ label, value, icon: Icon, tone = 'primary', meta, to }: { label: string; value: ReactNode; icon: LucideIcon; tone?: 'primary' | 'warning' | 'danger' | 'featured'; meta?: ReactNode; to?: string }) {
  const featured = tone === 'featured';
  const tile = {
    primary: 'bg-primary-tint text-primary-hover',
    warning: 'bg-warning-tint text-warning-text',
    danger: 'bg-danger-tint text-danger-text',
    featured: 'bg-surface-card text-primary-hover',
  }[tone];
  const body = (
    <div data-testid="stat-card" className={cn('flex h-full flex-col gap-2 rounded-md border p-4 transition-shadow sm:p-6', featured ? 'border-transparent bg-brand text-on-secondary' : 'border-border bg-surface-card shadow-card', to && 'hover:shadow-overlay')}>
      <div className={cn('flex items-center justify-between gap-2 text-label', featured ? 'text-on-secondary-muted' : 'text-ink-muted')}>
        <span>{label}</span>
        <span className={cn('grid size-9 place-items-center rounded-sm', tile)}>
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <div className="tabular text-stat-value">{value}</div>
      {meta && <div className={cn('text-body-sm', featured ? 'text-on-secondary-muted' : 'text-ink-muted')}>{meta}</div>}
    </div>
  );
  return to ? <Link to={to} className="block rounded-md">{body}</Link> : body;
}

import type { ReactNode } from 'react';
import { Link } from '@/lib/router';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../../auth/useAuth';

/**
 * Page title row. The header bar already names the module, so the big title shows only where it adds
 * something the bar cannot (`showTitle`: the dashboard, a pay run's month, a department's name, add vs edit).
 * Hidden titles stay as the page's h1 for screen readers.
 */
export function PageHeader({ title, actions, subtitle, showTitle = false }: { title: string; actions?: ReactNode; subtitle?: ReactNode; showTitle?: boolean }) {
  if (!showTitle && !subtitle && !actions) return <h1 className="sr-only">{title}</h1>;
  return (
    <div className={cn('flex flex-wrap justify-between gap-3', showTitle ? 'mb-6' : 'mb-3', showTitle || subtitle ? 'items-end' : 'items-center justify-end')}>
      <div className={cn(!showTitle && !subtitle && 'sr-only')}>
        <h1 className={showTitle ? 'text-page-title' : 'sr-only'}>{title}</h1>
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

/** Back to the parent list, the same on every detail and form page. */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mb-3 inline-flex items-center gap-1 rounded-sm text-body-sm text-primary-hover hover:underline">
      <ArrowLeft className="size-4" aria-hidden />{children}
    </Link>
  );
}

/** Money for a StatCard: the amount stays on one line and the symbol drops to label size. */
export function MoneyValue({ amount, symbol }: { amount: number; symbol: string }) {
  return (
    // The number never breaks; on a narrow card the symbol wraps under it instead of overflowing.
    <span className="inline-flex flex-wrap items-baseline gap-x-1">
      <span className="whitespace-nowrap text-stat-money">{Math.round(amount).toLocaleString('en-US')}</span>
      <span className="text-label">{symbol}</span>
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
    // Icon sits beside the label so the value and meta get the card's full width (kip amounts are long).
    <div data-testid="stat-card" className={cn('flex h-full min-w-0 flex-col gap-1 rounded-md border p-4 transition-shadow sm:p-5', featured ? 'border-transparent bg-brand text-on-secondary' : 'border-border bg-surface-card shadow-card', to && 'hover:shadow-overlay')}>
      <div className={cn('flex items-center gap-2 text-label', featured ? 'text-on-secondary-muted' : 'text-ink-muted')}>
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-sm', tile)}>
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0">{label}</span>
      </div>
      <div className="tabular mt-1 text-stat-value">{value}</div>
      {meta && <div className={cn('text-body-sm', featured ? 'text-on-secondary-muted' : 'text-ink-muted')}>{meta}</div>}
    </div>
  );
  return to ? <Link to={to} className="block rounded-md">{body}</Link> : body;
}

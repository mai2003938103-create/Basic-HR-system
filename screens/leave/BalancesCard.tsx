import { useTranslation } from 'react-i18next';
import { localName } from '../../i18n';
import type { LeaveBalance } from '../../lib/types';

export function BalancesCard({ balances }: { balances: LeaveBalance[] }) {
  const { t } = useTranslation();
  const shown = balances.filter((b) => b.leaveType.isPaid);
  if (!shown.length) return null;
  return (
    // Phones: one compact row that scrolls sideways, so the request list stays on the first screen.
    <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
      {shown.map((b) => {
        const pct = b.entitledDays ? Math.min(100, (b.usedDays / b.entitledDays) * 100) : 0;
        return (
          <div key={b.id} data-testid={`balance-${b.leaveType.code}`} className="w-[9.5rem] shrink-0 snap-start rounded-md border border-border bg-surface-card p-3 shadow-card sm:w-auto sm:p-4">
            <p className="truncate text-label text-ink-muted" title={localName(b.leaveType)}>{localName(b.leaveType)}</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="tabular text-section-title font-bold text-primary-hover sm:text-stat-value">{b.remainingDays}</span>
              <span className="text-body-sm text-ink-muted">/ {b.entitledDays} {t('leave.remaining')}</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden>
              <div className="h-full rounded-pill bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-caption font-normal text-ink-muted">{t('leave.used')}: {b.usedDays}</p>
          </div>
        );
      })}
    </div>
  );
}

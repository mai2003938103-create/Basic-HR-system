import { useTranslation } from 'react-i18next';
import { localName } from '../../i18n';
import type { LeaveBalance } from '../../lib/types';

export function BalancesCard({ balances }: { balances: LeaveBalance[] }) {
  const { t } = useTranslation();
  const shown = balances.filter((b) => b.leaveType.isPaid);
  if (!shown.length) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {shown.map((b) => {
        const pct = b.entitledDays ? Math.min(100, (b.usedDays / b.entitledDays) * 100) : 0;
        return (
          <div key={b.id} data-testid={`balance-${b.leaveType.code}`} className="rounded-md border border-border bg-surface-card p-4 shadow-card">
            <p className="text-label text-ink-muted">{localName(b.leaveType)}</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="tabular text-stat-value text-primary-hover">{b.remainingDays}</span>
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

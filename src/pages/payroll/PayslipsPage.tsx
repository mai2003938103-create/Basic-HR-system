import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/layout-bits';
import { LoadingState } from '../../components/common/LoadingState';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAuth } from '../../auth/useAuth';
import { useQuery } from '../../hooks/useQuery';
import { currencyOf, useSettings } from '../../hooks/useSettings';
import { api, apiError } from '../../lib/api';
import { formatDate, formatMoney } from '../../lib/format';
import { formatPeriod, type Payslip, type PayslipRow } from '../../lib/payroll';
import { cn } from '@/lib/utils';
import { PayslipView } from './PayslipView';

/** The hosted prototype's frame cannot open the print dialog. */
const PROTOTYPE = import.meta.env.VITE_PROTOTYPE === '1';

export function PayslipsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const cur = currencyOf(useSettings());
  const list = useQuery(() => api.get<{ data: PayslipRow[] }>('/payslips').then((r) => r.data.data), [user?.id], !!user?.employee);
  const [selected, setSelected] = useState<PayslipRow | null>(null);
  useEffect(() => { if (!selected && list.data?.length) setSelected(list.data[0]); }, [list.data, selected]);
  const slip = useQuery(() => api.get<{ data: Payslip }>(`/payslips/${selected!.payRunId}/${selected!.employeeId}`).then((r) => r.data.data), [selected?.payRunId], !!selected);

  if (!user?.employee) return (<><PageHeader title={t('nav.payslips')} /><Card><EmptyState title={t('profile.noEmployee')} /></Card></>);

  return (
    <>
      <PageHeader title={t('nav.payslips')} subtitle={t('payroll.payslipsSubtitle')} actions={slip.data && !PROTOTYPE && <Button variant="outline" onClick={() => window.print()}><Printer />{t('payroll.print')}</Button>} />
      {list.error ? <ErrorState onRetry={list.reload} message={apiError(list.error).messageKey} /> : !list.data ? <LoadingState rows={4} /> : list.data.length === 0 ? (
        <Card><EmptyState title={t('payroll.noPayslips')} text={t('payroll.noPayslipsHint')} /></Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
          <Card className="overflow-hidden print:hidden">
            <ul className="divide-y divide-border" aria-label={t('nav.payslips')}>
              {list.data.map((p) => {
                const active = selected?.payRunId === p.payRunId;
                return (
                  <li key={p.payRunId}>
                    <button type="button" aria-current={active || undefined} onClick={() => setSelected(p)} className={cn('flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-sunken', active && 'bg-primary-tint')}>
                      <span><span className="block text-label">{formatPeriod(p.period)}</span><span className="tabular block text-body-sm text-ink-muted">{t('payroll.paidOn', { date: formatDate(p.paidAt ?? p.payDate) })}</span></span>
                      <span className={cn('tabular text-label', active && 'text-primary-hover')}>{formatMoney(p.net, cur)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          {slip.error ? <ErrorState onRetry={slip.reload} message={apiError(slip.error).messageKey} /> : !slip.data ? <LoadingState rows={6} /> : <PayslipView slip={slip.data} />}
        </div>
      )}
    </>
  );
}

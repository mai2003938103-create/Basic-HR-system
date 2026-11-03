import { Banknote, Building2, ChevronRight, Plus, ReceiptText, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DataTable, type Column } from '../../components/common/DataTable';
import { FormField } from '../../components/common/FormField';
import { DashboardCard, MoneyValue, PageHeader, PermissionGate } from '../../components/common/layout-bits';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { useQuery } from '../../hooks/useQuery';
import { currencyOf, useSettings } from '../../hooks/useSettings';
import { api, apiError } from '../../lib/api';
import { formatAmount, formatDate, formatMoney, todayLocal } from '../../lib/format';
import { formatPeriod, type PayRunSummary } from '../../lib/payroll';
import { useLocalTable } from './useLocalTable';

function CreateRunDialog({ open, onOpenChange, existing }: { open: boolean; onOpenChange: (o: boolean) => void; existing: string[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(todayLocal().slice(0, 7));
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (existing.includes(period)) return setError('errors.payroll.periodExists');
    setBusy(true);
    try {
      const r = await api.post<{ data: PayRunSummary }>('/payroll/runs', { period });
      toast.success(t('payroll.created', { period: formatPeriod(period) }));
      navigate(`/payroll/${r.data.data.id}`);
    } catch (e) {
      setError(apiError(e).fieldErrors.period ?? apiError(e).messageKey);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('payroll.newRun')}</DialogTitle>
          <DialogDescription>{t('payroll.newRunHint')}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <FormField label={t('payroll.period')} error={error} required>
            <Input type="month" value={period} onChange={(e) => { setPeriod(e.target.value); setError(undefined); }} />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={save} loading={busy} disabled={!period}>{t('payroll.createRun')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PayrollPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cur = currencyOf(useSettings());
  const q = useQuery(() => api.get<{ data: PayRunSummary[] }>('/payroll/runs').then((r) => r.data.data), []);
  const [creating, setCreating] = useState(false);
  const runs = useMemo(() => q.data ?? [], [q.data]);
  const table = useLocalTable(runs, 'period:desc', { period: (r) => r.period, totalNet: (r) => r.totalNet, totalGross: (r) => r.totalGross, employeeCount: (r) => r.employeeCount });
  const latest = runs.find((r) => r.status !== 'draft') ?? runs[0];
  const m = (n: number) => formatMoney(n, cur);

  const columns: Column<PayRunSummary>[] = [
    { key: 'period', header: t('payroll.period'), sortable: true, cell: (r) => <Link to={`/payroll/${r.id}`} className="font-medium text-primary-hover hover:underline">{formatPeriod(r.period)}</Link> },
    { key: 'employeeCount', header: t('payroll.employees'), sortable: true, align: 'right', cell: (r) => r.employeeCount },
    { key: 'totalGross', header: t('payroll.gross'), sortable: true, align: 'right', cell: (r) => formatAmount(r.totalGross) },
    { key: 'totalNet', header: t('payroll.net'), sortable: true, align: 'right', cell: (r) => <span className="font-medium">{formatAmount(r.totalNet)}</span> },
    { key: 'payDate', header: t('payroll.payDate'), cell: (r) => <span className="tabular">{formatDate(r.payDate)}</span> },
    { key: 'status', header: t('common.status'), cell: (r) => <StatusBadge kind="payroll" value={r.status} /> },
    { key: 'go', header: '', cell: (r) => <Button variant="subtle" size="iconSm" asChild><Link to={`/payroll/${r.id}`} aria-label={`${t('common.view')} ${formatPeriod(r.period)}`}><ChevronRight /></Link></Button> },
  ];

  return (
    <>
      <PageHeader title={t('payroll.title')} subtitle={t('payroll.subtitle')} actions={<PermissionGate permission="payroll.manage"><Button onClick={() => setCreating(true)}><Plus />{t('payroll.newRun')}</Button></PermissionGate>} />
      {latest && (
        <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard tone="featured" icon={Banknote} label={t('payroll.latestNet', { period: formatPeriod(latest.period) })} value={<MoneyValue amount={latest.totalNet} symbol={cur.symbol} />} meta={<StatusBadge kind="payroll" value={latest.status} className="bg-surface-card" />} to={`/payroll/${latest.id}`} />
          <DashboardCard icon={ReceiptText} label={t('payroll.gross')} value={<MoneyValue amount={latest.totalGross} symbol={cur.symbol} />} meta={formatPeriod(latest.period)} />
          <DashboardCard icon={Building2} label={t('payroll.employerCost')} value={<MoneyValue amount={latest.totalEmployerCost} symbol={cur.symbol} />} meta={t('payroll.employerCostHint')} />
          <DashboardCard icon={Users} label={t('payroll.employees')} value={latest.employeeCount} meta={t('payroll.taxAndSs', { tax: m(latest.totalTax), ss: m(latest.totalSsEmployee) })} />
        </div>
      )}
      <Card>
        <p className="px-6 pt-4 text-right text-body-sm text-ink-muted">{t('payroll.amountsIn', { symbol: cur.symbol })}</p>
        <DataTable
          columns={columns}
          rows={table.rows}
          total={table.total}
          params={table.params}
          loading={q.loading}
          error={q.error}
          onRetry={q.reload}
          onSortChange={table.setSort}
          onPageChange={table.setPage}
          onRowClick={(r) => navigate(`/payroll/${r.id}`)}
          emptyTitle={t('payroll.emptyTitle')}
          emptyAction={<PermissionGate permission="payroll.manage"><Button onClick={() => setCreating(true)}><Plus />{t('payroll.newRun')}</Button></PermissionGate>}
          mobileCard={(r) => (
            <Link to={`/payroll/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block font-medium">{formatPeriod(r.period)}</span>
                <span className="tabular block text-body-sm text-ink-muted">{t('payroll.employeesN', { n: r.employeeCount })} · {m(r.totalNet)}</span>
              </span>
              <StatusBadge kind="payroll" value={r.status} />
            </Link>
          )}
        />
      </Card>
      {creating && <CreateRunDialog open onOpenChange={setCreating} existing={runs.map((r) => r.period)} />}
    </>
  );
}

import { ArrowLeft, Banknote, Building2, Check, Download, FileText, Minus, Pencil, Printer, RefreshCw, Send, Trash2, TrendingDown, TrendingUp, Undo2, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from '@/lib/router';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ErrorState } from '../../components/common/EmptyState';
import { FormField } from '../../components/common/FormField';
import { FilterDropdown, SearchBar } from '../../components/common/inputs';
import { DashboardCard, MoneyValue, PageHeader } from '../../components/common/layout-bits';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input, Textarea } from '../../components/ui/input';
import { useQuery } from '../../hooks/useQuery';
import { currencyOf, useSettings } from '../../hooks/useSettings';
import { localName } from '../../i18n';
import { api, apiError } from '../../lib/api';
import { downloadFile } from '../../lib/download';
import { toastError } from '../../lib/form-errors';
import { formatAmount, formatDate, formatDateTime, formatMoney, fullName } from '../../lib/format';
import { formatPeriod, type PayLine, type PayRunDetail, type PayRunStatus, type Payslip } from '../../lib/payroll';
import { cn } from '@/lib/utils';
import { PayslipView } from './PayslipView';

/** The hosted prototype's frame cannot open the print dialog. */
import { useLocalTable } from './useLocalTable';

const STEPS: PayRunStatus[] = ['draft', 'pending', 'approved', 'paid'];

function Stepper({ run }: { run: PayRunDetail }) {
  const { t } = useTranslation();
  const at = STEPS.indexOf(run.status);
  const when = [run.createdAt, run.submittedAt, run.approvedAt, run.paidAt];
  return (
    <ol className="mb-6 grid gap-3 sm:grid-cols-4" aria-label={t('payroll.progress')}>
      {STEPS.map((s, i) => {
        const done = i < at || run.status === 'paid';
        const current = i === at && run.status !== 'paid';
        return (
          <li key={s} aria-current={current ? 'step' : undefined} className={cn('flex items-center gap-3 rounded-md border bg-surface-card p-4', current ? 'border-primary' : 'border-border')}>
            <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-label', done ? 'bg-primary text-on-primary' : current ? 'bg-primary-tint text-primary-hover' : 'bg-surface-sunken text-ink-muted')}>
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-label">{t(`payroll.steps.${s}`)}</span>
              <span className="tabular block truncate text-body-sm text-ink-muted">{done || current ? formatDateTime(when[i]) || '—' : '—'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AdjustDialog({ run, line, onClose, onSaved }: { run: PayRunDetail; line: PayLine; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ allowance: String(line.item.allowance), bonus: String(line.item.bonus), overtimeHours: String(line.item.overtimeMinutes / 60), unpaidDays: String(line.item.unpaidDays), otherDeduction: String(line.item.otherDeduction), note: line.item.note ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    const e: Record<string, string> = {};
    for (const k of ['allowance', 'bonus', 'overtimeHours', 'unpaidDays', 'otherDeduction'] as const) if (f[k] === '' || !(Number(f[k]) >= 0)) e[k] = 'errors.validation.money';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.put(`/payroll/runs/${run.id}/items/${line.employeeId}`, { allowance: Number(f.allowance), bonus: Number(f.bonus), overtimeMinutes: Math.round(Number(f.overtimeHours) * 60), unpaidDays: Number(f.unpaidDays), otherDeduction: Number(f.otherDeduction), note: f.note.trim() || null });
      toast.success(t('common.saved'));
      onSaved();
      onClose();
    } catch (err) {
      const info = apiError(err);
      if (Object.keys(info.fieldErrors).length) setErrors(info.fieldErrors); else toastError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('payroll.adjustTitle', { name: fullName(line.employee) })}</DialogTitle></DialogHeader>
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('payroll.allowance')} error={errors.allowance}><Input type="number" min={0} step={1000} value={f.allowance} onChange={set('allowance')} /></FormField>
          <FormField label={t('payroll.bonus')} error={errors.bonus}><Input type="number" min={0} step={1000} value={f.bonus} onChange={set('bonus')} /></FormField>
          <FormField label={t('payroll.overtimeHours')} error={errors.overtimeHours} hint={t('payroll.fromAttendance')}><Input type="number" min={0} step={0.5} value={f.overtimeHours} onChange={set('overtimeHours')} /></FormField>
          <FormField label={t('payroll.unpaidDays')} error={errors.unpaidDays} hint={t('payroll.fromLeave')}><Input type="number" min={0} step={0.5} value={f.unpaidDays} onChange={set('unpaidDays')} /></FormField>
          <FormField label={t('payroll.otherDeduction')} error={errors.otherDeduction} hint={t('payroll.otherDeductionHint')} className="sm:col-span-2"><Input type="number" min={0} step={1000} value={f.otherDeduction} onChange={set('otherDeduction')} /></FormField>
          <FormField label={t('common.note')} className="sm:col-span-2"><Textarea rows={2} value={f.note} onChange={set('note')} /></FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={save} loading={busy}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A line counts as changed when it is new or its net pay moved by 1% or more. */
const isChanged = (l: { previousNet: number | null; calc: { net: number } }, hasPrevious: boolean) =>
  hasPrevious && (l.previousNet === null || Math.abs(l.calc.net - l.previousNet) >= Math.max(1, Math.abs(l.previousNet) * 0.01));

/** Percentage change against the previous run, with direction shown by arrow and sign (not colour alone). */
function Delta({ now, before, period }: { now: number; before: number; period?: string }) {
  const { t } = useTranslation();
  if (!before) return null;
  const pct = ((now - before) / before) * 100;
  const flat = Math.abs(pct) < 0.05;
  const Icon = flat ? Minus : pct > 0 ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <Icon className="size-3.5" aria-hidden />
      <span className="tabular">{flat ? '0%' : `${pct > 0 ? '+' : '−'}${Math.abs(pct).toFixed(1)}%`}</span>
      {period && <span>{t('payroll.vsPeriod', { period: formatPeriod(period) })}</span>}
    </span>
  );
}

function LineChange({ line }: { line: { previousNet: number | null; calc: { net: number } } }) {
  const { t } = useTranslation();
  if (line.previousNet === null) return <span className="rounded-pill bg-primary-tint px-2 py-0.5 text-caption text-primary-hover">{t('payroll.newEmployee')}</span>;
  const diff = line.calc.net - line.previousNet;
  if (Math.abs(diff) < 1) return <span className="text-ink-muted">—</span>;
  const big = Math.abs(diff) >= Math.abs(line.previousNet) * 0.1;
  return (
    <span className={cn('tabular inline-flex items-center gap-1', big ? 'font-semibold text-warning-text' : 'text-ink-muted')} title={big ? t('payroll.bigChange') : undefined}>
      {diff > 0 ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
      {diff > 0 ? '+' : '−'}{formatAmount(Math.abs(diff))}
    </span>
  );
}

export function PayslipDialog({ runId, employeeId, onClose }: { runId: string; employeeId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const q = useQuery(() => api.get<{ data: Payslip }>(`/payslips/${runId}/${employeeId}`).then((r) => r.data.data), [runId, employeeId]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent wide className="payslip-dialog">
        <DialogHeader><DialogTitle>{t('payroll.payslip')}</DialogTitle></DialogHeader>
        <DialogBody className="max-h-[75vh] pb-4">
          {q.error ? <ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} /> : !q.data ? <LoadingState rows={6} /> : <PayslipView slip={q.data} />}
        </DialogBody>
        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
          {<Button onClick={() => window.print()} disabled={!q.data}><Printer />{t('payroll.print')}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Action = 'submit' | 'approve' | 'pay' | 'delete' | 'recalculate';

export function PayRunPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const cur = currencyOf(useSettings());
  const m = (n: number) => formatMoney(n, cur);
  const q = useQuery(() => api.get<{ data: PayRunDetail }>(`/payroll/runs/${id}`).then((r) => r.data.data), [id]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState<string>();
  const [changedOnly, setChangedOnly] = useState(false);
  const [editing, setEditing] = useState<PayLine | null>(null);
  const [slip, setSlip] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [returning, setReturning] = useState(false);
  const [returnNote, setReturnNote] = useState('');

  const run = q.data;
  const lines = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (run?.lines ?? [])
      .filter((l) => (!dept || l.employee.departmentId === dept) && (!s || `${l.employee.employeeCode} ${fullName(l.employee)}`.toLowerCase().includes(s)) && (!changedOnly || isChanged(l, !!run?.previous)))
      .map((l) => ({ ...l, id: l.employeeId }));
  }, [run, search, dept, changedOnly]);
  const changedCount = useMemo(() => (run?.lines ?? []).filter((l) => isChanged(l, !!run?.previous)).length, [run]);
  const table = useLocalTable(lines, 'code:asc', { code: (l) => l.employee.employeeCode, name: (l) => l.employee.firstName, gross: (l) => l.calc.gross, net: (l) => l.calc.net, basic: (l) => l.calc.basic }, 50);
  const depts = useMemo(() => { const map = new Map<string, { id: string; nameLo: string; nameEn: string }>(); for (const l of run?.lines ?? []) if (l.employee.department) map.set(l.employee.departmentId, l.employee.department); return [...map.entries()]; }, [run]);

  if (q.error) return <ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} />;
  if (!run) return <LoadingState rows={6} />;

  const doAction = async (a: Action) => {
    try {
      if (a === 'delete') { await api.delete(`/payroll/runs/${run.id}`); toast.success(t('common.deleted')); navigate('/payroll'); return; }
      if (a === 'recalculate') await api.post(`/payroll/runs/${run.id}/recalculate`);
      else await api.put(`/payroll/runs/${run.id}/${a}`);
      toast.success(t(`payroll.done.${a}`));
      void q.reload();
    } catch (e) {
      toastError(e);
    }
  };

  type Row = PayRunDetail['lines'][number] & { id: string };
  const columns: Column<Row>[] = [
    { key: 'name', header: t('payroll.employee'), sortable: true, className: 'min-w-[13rem]', cell: (l) => <span><span className="block font-medium">{fullName(l.employee)}</span><span className="block text-body-sm text-ink-muted">{l.employee.employeeCode} · {localName(l.employee.department)}</span></span> },
    { key: 'basic', header: t('payroll.basic'), sortable: true, align: 'right', cell: (l) => formatAmount(l.calc.basic) },
    { key: 'extra', header: t('payroll.extraEarnings'), align: 'right', cell: (l) => <span title={`${t('payroll.allowance')} ${formatAmount(l.calc.allowance)} · ${t('payroll.overtimePay')} ${formatAmount(l.calc.overtimePay)} · ${t('payroll.bonus')} ${formatAmount(l.calc.bonus)}`}>{formatAmount(l.calc.allowance + l.calc.overtimePay + l.calc.bonus)}</span> },
    { key: 'gross', header: t('payroll.gross'), sortable: true, align: 'right', cell: (l) => formatAmount(l.calc.gross) },
    {
      key: 'deductions', header: t('payroll.deductions'), align: 'right',
      // One column keeps the comparison visible at 1366 px; the breakdown is in the tooltip and on the payslip.
      cell: (l) => (
        <span title={`${t('payroll.ssShort')} ${formatAmount(l.calc.ssEmployee)} · ${t('payroll.taxShort')} ${formatAmount(l.calc.incomeTax)}${l.calc.otherDeduction ? ` · ${t('payroll.otherShort')} ${formatAmount(l.calc.otherDeduction)}` : ''}`}>
          {formatAmount(l.calc.totalDeductions)}
          {l.calc.otherDeduction > 0 && <span className="block text-caption font-normal text-danger-text">{t('payroll.inclOther', { amount: formatAmount(l.calc.otherDeduction) })}</span>}
        </span>
      ),
    },
    {
      key: 'net', header: run.previous ? t('payroll.netAndChange') : t('payroll.net'), sortable: true, align: 'right',
      // The change against last run sits under the amount, so approvers see both without an extra column.
      cell: (l) => (
        <span className="flex flex-col items-end">
          <span className="font-semibold">{formatAmount(l.calc.net)}</span>
          {run.previous && <span className="text-caption font-normal"><LineChange line={l} /></span>}
        </span>
      ),
    },
    {
      key: 'actions', header: '', cell: (l) => (
        <span className="flex justify-end gap-1">
          <Button variant="subtle" size="iconSm" aria-label={`${t('payroll.payslip')} ${fullName(l.employee)}`} title={t('payroll.payslip')} onClick={() => setSlip(l.employeeId)}><FileText /></Button>
          {run.canEdit && <Button variant="subtle" size="iconSm" aria-label={`${t('payroll.adjust')} ${fullName(l.employee)}`} title={t('payroll.adjust')} onClick={() => setEditing(l)}><Pencil /></Button>}
        </span>
      ),
    },
  ];

  const banner = {
    draft: run.canEdit ? t('payroll.banner.draft') : t('payroll.banner.draftView'),
    pending: run.canApprove ? t('payroll.banner.pendingApprover') : t('payroll.banner.pending'),
    approved: run.canPay ? t('payroll.banner.approvedPay') : t('payroll.banner.approved'),
    paid: t('payroll.banner.paid', { date: formatDate(run.paidAt) }),
  }[run.status];

  const confirmCopy: Record<Action, { title: string; desc: string; label: string; tone?: 'danger' }> = {
    submit: { title: t('payroll.confirm.submit', { period: formatPeriod(run.period) }), desc: t('payroll.confirm.submitDesc', { n: run.employeeCount, net: m(run.totalNet) }), label: t('payroll.submit') },
    approve: { title: t('payroll.confirm.approve', { period: formatPeriod(run.period) }), desc: t('payroll.confirm.approveDesc', { net: m(run.totalNet), cost: m(run.totalEmployerCost) }), label: t('payroll.approve') },
    pay: { title: t('payroll.confirm.pay', { period: formatPeriod(run.period) }), desc: t('payroll.confirm.payDesc'), label: t('payroll.markPaid') },
    delete: { title: t('payroll.confirm.delete', { period: formatPeriod(run.period) }), desc: t('common.cannotUndo'), label: t('common.delete'), tone: 'danger' },
    recalculate: { title: t('payroll.confirm.recalculate'), desc: t('payroll.confirm.recalculateDesc'), label: t('payroll.recalculate') },
  };

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2"><Link to="/payroll"><ArrowLeft />{t('payroll.title')}</Link></Button>
      <PageHeader
        title={t('payroll.runTitle', { period: formatPeriod(run.period) })}
        subtitle={<span className="inline-flex flex-wrap items-center gap-2"><StatusBadge kind="payroll" value={run.status} />{t('payroll.payDate')}: {formatDate(run.payDate)}</span>}
        actions={
          <>
            <Button variant="outline" onClick={() => downloadFile(`/payroll/runs/${run.id}/export`, { lang: i18n.language }, `payroll-${run.period}.csv`).catch(toastError)}><Download />{t('payroll.exportBank')}</Button>
            {run.canEdit && <Button variant="outline" onClick={() => setAction('recalculate')}><RefreshCw />{t('payroll.recalculate')}</Button>}
            {run.canEdit && <Button variant="subtle" size="icon" aria-label={t('payroll.deleteDraft')} title={t('payroll.deleteDraft')} onClick={() => setAction('delete')}><Trash2 /></Button>}
            {run.canSubmit && <Button onClick={() => setAction('submit')}><Send />{t('payroll.submit')}</Button>}
            {run.canApprove && <Button variant="outline" onClick={() => setReturning(true)}><Undo2 />{t('payroll.return')}</Button>}
            {run.canApprove && <Button onClick={() => setAction('approve')}><Check />{t('payroll.approve')}</Button>}
            {run.canPay && <Button onClick={() => setAction('pay')}><Wallet />{t('payroll.markPaid')}</Button>}
          </>
        }
      />
      <Stepper run={run} />
      <p role="status" className="mb-6 rounded-sm bg-primary-tint px-4 py-3 text-body-sm text-ink">{banner}</p>
      <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard tone="featured" icon={Banknote} label={t('payroll.totalNet')} value={<MoneyValue amount={run.totalNet} symbol={cur.symbol} />} meta={<>{t('payroll.employeesN', { n: run.employeeCount })}{run.previous && <> · <Delta now={run.totalNet} before={run.previous.totalNet} /></>}</>} />
        <DashboardCard icon={FileText} label={t('payroll.gross')} value={<MoneyValue amount={run.totalGross} symbol={cur.symbol} />} meta={run.previous && <Delta now={run.totalGross} before={run.previous.totalGross} period={run.previous.period} />} />
        <DashboardCard icon={Undo2} tone="warning" label={t('payroll.taxAndSsTitle')} value={<MoneyValue amount={run.totalTax + run.totalSsEmployee} symbol={cur.symbol} />} meta={t('payroll.taxAndSs', { tax: m(run.totalTax), ss: m(run.totalSsEmployee) })} />
        <DashboardCard icon={Building2} label={t('payroll.employerCost')} value={<MoneyValue amount={run.totalEmployerCost} symbol={cur.symbol} />} meta={run.previous ? <Delta now={run.totalEmployerCost} before={run.previous.totalEmployerCost} period={run.previous.period} /> : t('payroll.employerSsShort', { amount: m(run.totalSsEmployer) })} />
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchBar value={search} onChange={setSearch} />
          <FilterDropdown label={t('employees.department')} value={dept} onChange={setDept} allLabel={t('employees.allDepartments')} options={depts.map(([v, d]) => ({ value: v, label: localName(d) }))} />
          {run.previous && (
            <button
              type="button"
              aria-pressed={changedOnly}
              onClick={() => setChangedOnly((v) => !v)}
              className={cn('flex h-10 items-center gap-2 rounded-pill border px-4 text-label', changedOnly ? 'border-primary bg-primary-tint text-primary-hover' : 'border-border-strong bg-surface-card text-ink hover:bg-surface-sunken')}
            >
              {changedOnly && <Check className="size-4" aria-hidden />}
              {t('payroll.changedOnly', { n: changedCount })}
            </button>
          )}
          <span className="ml-auto text-body-sm text-ink-muted">{t('payroll.amountsIn', { symbol: cur.symbol })}</span>
        </div>
        {run.previous && (
          <p className="border-t border-border px-6 py-3 text-body-sm text-ink-muted">
            {t('payroll.comparedWith', { period: formatPeriod(run.previous.period), n: run.previous.employeeCount })}
            {run.lines.some((l) => l.previousNet === null) && <> · {t('payroll.newThisRun', { n: run.lines.filter((l) => l.previousNet === null).length })}</>}
            {run.leavers.length > 0 && <> · {t('payroll.leftSince', { names: run.leavers.map((x) => fullName(x)).join(', ') })}</>}
          </p>
        )}
        <DataTable
          columns={columns}
          rows={table.rows}
          total={table.total}
          params={table.params}
          loading={q.loading}
          onSortChange={table.setSort}
          onPageChange={table.setPage}
          emptyTitle={t('common.emptyFiltered')}
          mobileCard={(l) => (
            <button type="button" onClick={() => setSlip(l.employeeId)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
              <span className="min-w-0"><span className="block truncate font-medium">{fullName(l.employee)}</span><span className="block text-body-sm text-ink-muted">{l.employee.employeeCode} · {t('payroll.gross')} {m(l.calc.gross)}</span></span>
              <span className="tabular font-semibold">{m(l.calc.net)}</span>
            </button>
          )}
        />
      </Card>
      <p className="mt-4 text-body-sm text-ink-muted">{t('payroll.sampleNote')}</p>

      {editing && <AdjustDialog run={run} line={editing} onClose={() => setEditing(null)} onSaved={q.reload} />}
      {slip && <PayslipDialog runId={run.id} employeeId={slip} onClose={() => setSlip(null)} />}
      {action && (
        <ConfirmDialog open onOpenChange={(o) => !o && setAction(null)} title={confirmCopy[action].title} description={confirmCopy[action].desc} confirmLabel={confirmCopy[action].label} tone={confirmCopy[action].tone ?? 'primary'} onConfirm={() => doAction(action)} />
      )}
      <Dialog open={returning} onOpenChange={setReturning}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('payroll.returnTitle', { period: formatPeriod(run.period) })}</DialogTitle></DialogHeader>
          <DialogBody><FormField label={t('payroll.returnNote')} required><Textarea rows={3} value={returnNote} onChange={(e) => setReturnNote(e.target.value)} /></FormField></DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(false)}>{t('common.cancel')}</Button>
            <Button disabled={!returnNote.trim()} onClick={async () => { try { await api.put(`/payroll/runs/${run.id}/reject`, { note: returnNote.trim() }); toast.success(t('payroll.done.reject')); setReturning(false); setReturnNote(''); void q.reload(); } catch (e) { toastError(e); } }}><Undo2 />{t('payroll.return')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

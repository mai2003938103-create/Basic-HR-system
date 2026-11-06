import { CalendarClock, Clock, Download, Hourglass, Percent, UserCheck, Users, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from '@/lib/router';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ErrorState } from '../../components/common/EmptyState';
import { FilterDropdown, SelectInput } from '../../components/common/inputs';
import { DashboardCard, MoneyValue, PageHeader } from '../../components/common/layout-bits';
import { LoadingState } from '../../components/common/LoadingState';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../auth/useAuth';
import { useDepartments } from '../../hooks/useDepartments';
import { useQuery } from '../../hooks/useQuery';
import { currencyOf, useSettings } from '../../hooks/useSettings';
import { localName } from '../../i18n';
import { api, apiError } from '../../lib/api';
import { saveCsv } from '../../lib/download';
import { formatMoney, fullName, todayLocal } from '../../lib/format';
import { formatPeriod, type PayRunSummary } from '../../lib/payroll';
import type { Named } from '../../lib/types';
import { BarsChart, RankedBars } from '../dashboard/charts';
import { useLocalTable } from '../payroll/useLocalTable';

type Brief = { id: string; employeeCode: string; firstName: string; lastName: string };
interface Headcount {
  total: number;
  byDepartment: (Named & { departmentId: string; active: number; probation: number; inactive: number; male: number; female: number; total: number })[];
  byGender: { gender: string; count: number }[];
  byTenure: { bucket: string; count: number }[];
  movement: { month: string; hires: number; exits: number }[];
}
interface AttRow { id: string; employee: Brief; department: Named | null; workDays: number; present: number; late: number; halfDay: number; absent: number; leave: number; lateMinutes: number; overtimeHours: number; rate: number }
interface LeaveReport { year: number; byType: (Named & { leaveTypeId: string; days: number; requests: number })[]; byMonth: { month: string; days: number }[]; rows: { id: string; employee: Brief; department: Named | null; balances: { code: string; entitled: number; used: number }[] }[] }
interface PayReport { year: number; byMonth: PayRunSummary[]; byDepartment: (Named & { departmentId: string; headcount: number; gross: number; employerCost: number })[]; latestPeriod: string | null }

const monthShort = (m: string) => `${m.slice(5, 7)}/${m.slice(2, 4)}`;
const stamp = () => todayLocal();

function Toolbar({ children, onExport }: { children?: React.ReactNode; onExport?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
      {onExport && <Button variant="outline" onClick={onExport}><Download />{t('reports.exportCsv')}</Button>}
    </div>
  );
}
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="flex flex-col gap-1 text-body-sm text-ink-muted">{label}{children}</label>;

function HeadcountTab() {
  const { t } = useTranslation();
  const q = useQuery(() => api.get<{ data: Headcount }>('/reports/headcount').then((r) => r.data.data), []);
  if (q.error) return <ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} />;
  const d = q.data;
  if (!d) return <LoadingState rows={4} />;
  const female = d.byGender.find((g) => g.gender === 'female')?.count ?? 0;
  const exportIt = () => saveCsv(`headcount-${stamp()}.csv`, [
    [t('employees.department'), t('status.employment.active'), t('status.employment.probation'), t('status.employment.inactive'), t('reports.male'), t('reports.female'), t('reports.total')],
    ...d.byDepartment.map((x) => [localName(x), x.active, x.probation, x.inactive, x.male, x.female, x.total]),
  ]);
  return (
    <>
      <Toolbar onExport={exportIt} />
      <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard tone="featured" icon={Users} label={t('reports.headcount')} value={d.total} meta={t('reports.excludesTerminated')} />
        <DashboardCard icon={UserCheck} label={t('reports.femaleShare')} value={`${d.total ? Math.round((female / d.total) * 100) : 0}%`} meta={t('reports.genderSplit', { f: female, m: d.total - female })} />
        <DashboardCard icon={CalendarClock} label={t('reports.hires12m')} value={d.movement.reduce((s, x) => s + x.hires, 0)} />
        <DashboardCard icon={Hourglass} label={t('reports.exits12m')} value={d.movement.reduce((s, x) => s + x.exits, 0)} meta={t('reports.sampleExits')} />
      </div>
      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <BarsChart className="xl:col-span-2" title={t('reports.byDepartmentStatus')} rows={d.byDepartment.map((x) => ({ label: localName(x), active: x.active, probation: x.probation, inactive: x.inactive }))} x="label"
          series={[{ key: 'active', label: t('status.employment.active'), color: 'var(--chart-1)' }, { key: 'probation', label: t('status.employment.probation'), color: 'var(--chart-2)' }, { key: 'inactive', label: t('status.employment.inactive'), color: 'var(--chart-3)' }]} />
        <RankedBars title={t('reports.tenure')} rows={d.byTenure.map((x) => ({ label: t(`reports.tenureBuckets.${x.bucket}`), value: x.count }))} />
      </div>
      <BarsChart title={t('reports.movement')} rows={d.movement} x="month" xFormat={monthShort}
        series={[{ key: 'hires', label: t('reports.hires'), color: 'var(--chart-1)' }, { key: 'exits', label: t('reports.exits'), color: 'var(--chart-4)' }]} />
    </>
  );
}

function AttendanceTab({ scopeAll }: { scopeAll: boolean }) {
  const { t, i18n } = useTranslation();
  const [month, setMonth] = useState(todayLocal().slice(0, 7));
  const [dept, setDept] = useState<string>();
  const depts = useDepartments(scopeAll);
  const q = useQuery(() => api.get<{ data: { month: string; workDays: number; rows: AttRow[] } }>('/reports/attendance', { params: { month, departmentId: dept } }).then((r) => r.data.data), [month, dept]);
  const rows = useMemo(() => q.data?.rows ?? [], [q.data]);
  const table = useLocalTable(rows, 'rate:asc', { name: (r) => r.employee.firstName, rate: (r) => r.rate, late: (r) => r.late, absent: (r) => r.absent, lateMinutes: (r) => r.lateMinutes, overtimeHours: (r) => r.overtimeHours });
  const avg = rows.length ? Math.round((rows.reduce((s, r) => s + r.rate, 0) / rows.length) * 10) / 10 : 0;
  const num = (n: number) => n.toLocaleString(i18n.language === 'lo' ? 'lo-LA' : 'en-US', { maximumFractionDigits: 1 });
  const columns: Column<AttRow>[] = [
    { key: 'name', header: t('payroll.employee'), sortable: true, cell: (r) => <span><span className="block font-medium">{fullName(r.employee)}</span><span className="block text-body-sm text-ink-muted">{r.employee.employeeCode} · {localName(r.department)}</span></span> },
    { key: 'present', header: t('status.attendance.present'), align: 'right', cell: (r) => r.present },
    { key: 'late', header: t('status.attendance.late'), sortable: true, align: 'right', cell: (r) => (r.late ? <span className="text-warning-text">{r.late}</span> : 0) },
    { key: 'halfDay', header: t('status.attendance.half_day'), align: 'right', cell: (r) => r.halfDay },
    { key: 'absent', header: t('status.attendance.absent'), sortable: true, align: 'right', cell: (r) => (r.absent ? <span className="text-danger-text">{r.absent}</span> : 0) },
    { key: 'leave', header: t('status.attendance.leave'), align: 'right', cell: (r) => r.leave },
    { key: 'lateMinutes', header: t('reports.lateMinutes'), sortable: true, align: 'right', cell: (r) => r.lateMinutes },
    { key: 'overtimeHours', header: t('reports.otHours'), sortable: true, align: 'right', cell: (r) => num(r.overtimeHours) },
    { key: 'rate', header: t('reports.attendanceRate'), sortable: true, align: 'right', cell: (r) => <span className={r.rate < 90 ? 'font-semibold text-danger-text' : 'font-medium'}>{num(r.rate)}%</span> },
  ];
  const exportIt = () => saveCsv(`attendance-${month}.csv`, [
    [t('reports.code'), t('reports.name'), t('employees.department'), t('status.attendance.present'), t('status.attendance.late'), t('status.attendance.half_day'), t('status.attendance.absent'), t('status.attendance.leave'), t('reports.lateMinutes'), t('reports.otHours'), t('reports.attendanceRate')],
    ...table.all.map((r) => [r.employee.employeeCode, fullName(r.employee), localName(r.department), r.present, r.late, r.halfDay, r.absent, r.leave, r.lateMinutes, r.overtimeHours, r.rate]),
  ]);
  return (
    <>
      <Toolbar onExport={rows.length ? exportIt : undefined}>
        <Field label={t('reports.month')}><Input type="month" className="w-48" value={month} max={todayLocal().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field>
        {scopeAll && <FilterDropdown label={t('employees.department')} value={dept} onChange={setDept} allLabel={t('employees.allDepartments')} options={(depts.data ?? []).map((d) => ({ value: d.id, label: localName(d) }))} />}
      </Toolbar>
      <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard tone="featured" icon={Percent} label={t('reports.avgAttendance')} value={`${num(avg)}%`} meta={t('reports.workDaysSoFar', { n: q.data?.workDays ?? 0 })} />
        <DashboardCard tone="warning" icon={Clock} label={t('reports.lateTimes')} value={rows.reduce((s, r) => s + r.late, 0)} meta={t('reports.lateMinutesTotal', { n: rows.reduce((s, r) => s + r.lateMinutes, 0) })} />
        <DashboardCard tone="danger" icon={UserCheck} label={t('reports.absentDays')} value={rows.reduce((s, r) => s + r.absent, 0)} />
        <DashboardCard icon={Hourglass} label={t('reports.otHours')} value={num(rows.reduce((s, r) => s + r.overtimeHours, 0))} />
      </div>
      <Card>
        <DataTable columns={columns} rows={table.rows} total={table.total} params={table.params} loading={q.loading} error={q.error} onRetry={q.reload} onSortChange={table.setSort} onPageChange={table.setPage} emptyTitle={t('common.emptyTitle')} />
      </Card>
    </>
  );
}

const LEAVE_CODES = ['ANNUAL', 'SICK', 'PERSONAL', 'UNPAID'];
function LeaveTab({ scopeAll }: { scopeAll: boolean }) {
  const { t } = useTranslation();
  const thisYear = Number(todayLocal().slice(0, 4));
  const [year, setYear] = useState(String(thisYear));
  const [dept, setDept] = useState<string>();
  const depts = useDepartments(scopeAll);
  const q = useQuery(() => api.get<{ data: LeaveReport }>('/reports/leave', { params: { year, departmentId: dept } }).then((r) => r.data.data), [year, dept]);
  const rows = useMemo(() => q.data?.rows ?? [], [q.data]);
  const table = useLocalTable(rows, 'name:asc', { name: (r) => r.employee.firstName, ...Object.fromEntries(LEAVE_CODES.map((c) => [c, (r: LeaveReport['rows'][number]) => r.balances.find((b) => b.code === c)?.used ?? 0])) });
  const bal = (r: LeaveReport['rows'][number], code: string) => r.balances.find((b) => b.code === code);
  const typeName = (code: string) => localName(q.data?.byType.find((x) => x.leaveTypeId === `lt_${code.toLowerCase()}`) ?? { nameLo: code, nameEn: code });
  const columns: Column<LeaveReport['rows'][number]>[] = [
    { key: 'name', header: t('payroll.employee'), sortable: true, cell: (r) => <span><span className="block font-medium">{fullName(r.employee)}</span><span className="block text-body-sm text-ink-muted">{r.employee.employeeCode} · {localName(r.department)}</span></span> },
    ...LEAVE_CODES.map((c) => ({ key: c, header: typeName(c), sortable: true, align: 'right' as const, cell: (r: LeaveReport['rows'][number]) => { const b = bal(r, c); return b ? <span>{b.used}<span className="text-ink-muted"> / {b.entitled}</span></span> : '—'; } })),
  ];
  const exportIt = () => saveCsv(`leave-${year}.csv`, [
    [t('reports.code'), t('reports.name'), t('employees.department'), ...LEAVE_CODES.flatMap((c) => [`${typeName(c)} (${t('leave.used')})`, `${typeName(c)} (${t('leave.entitled')})`])],
    ...table.all.map((r) => [r.employee.employeeCode, fullName(r.employee), localName(r.department), ...LEAVE_CODES.flatMap((c) => [bal(r, c)?.used ?? '', bal(r, c)?.entitled ?? ''])]),
  ]);
  return (
    <>
      <Toolbar onExport={rows.length ? exportIt : undefined}>
        <Field label={t('leave.year')}><div className="w-32"><SelectInput value={year} onChange={setYear} options={[thisYear, thisYear - 1].map((y) => ({ value: String(y), label: String(y) }))} /></div></Field>
        {scopeAll && <FilterDropdown label={t('employees.department')} value={dept} onChange={setDept} allLabel={t('employees.allDepartments')} options={(depts.data ?? []).map((d) => ({ value: d.id, label: localName(d) }))} />}
      </Toolbar>
      {q.error ? <ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} /> : !q.data ? <LoadingState rows={4} /> : (
        <>
          <div className="mb-6 grid gap-6 xl:grid-cols-3">
            <BarsChart className="xl:col-span-2" title={t('reports.leaveByMonth')} rows={q.data.byMonth} x="month" xFormat={(m) => t(`common.months.m${Number(m.slice(5, 7))}`).slice(0, 6)} series={[{ key: 'days', label: t('reports.leaveDays'), color: 'var(--chart-1)' }]} />
            <RankedBars title={t('reports.leaveByType')} rows={q.data.byType.filter((x) => x.days).map((x) => ({ label: localName(x), value: x.days }))} />
          </div>
          <Card>
            <DataTable columns={columns} rows={table.rows} total={table.total} params={table.params} loading={q.loading} onSortChange={table.setSort} onPageChange={table.setPage} emptyTitle={t('common.emptyTitle')} />
          </Card>
          <p className="mt-3 text-body-sm text-ink-muted">{t('reports.usedOfEntitled')}</p>
        </>
      )}
    </>
  );
}

function PayrollTab() {
  const { t } = useTranslation();
  const cur = currencyOf(useSettings());
  const thisYear = Number(todayLocal().slice(0, 4));
  const [year, setYear] = useState(String(thisYear));
  const q = useQuery(() => api.get<{ data: PayReport }>('/reports/payroll', { params: { year } }).then((r) => r.data.data), [year]);
  if (q.error) return <ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} />;
  const d = q.data;
  const m = (n: number) => formatMoney(n, cur);
  const mil = (n: number) => `${(n / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  const total = (k: keyof PayRunSummary) => (d?.byMonth ?? []).reduce((s, r) => s + (r[k] as number), 0);
  const rows = (d?.byMonth ?? []).map((r) => ({ ...r }));
  const columns: Column<PayRunSummary>[] = [
    { key: 'period', header: t('payroll.period'), cell: (r) => formatPeriod(r.period) },
    { key: 'employeeCount', header: t('payroll.employees'), align: 'right', cell: (r) => r.employeeCount },
    { key: 'totalGross', header: t('payroll.gross'), align: 'right', cell: (r) => m(r.totalGross) },
    { key: 'totalSsEmployee', header: t('reports.ssEmployee'), align: 'right', cell: (r) => m(r.totalSsEmployee) },
    { key: 'totalSsEmployer', header: t('reports.ssEmployer'), align: 'right', cell: (r) => m(r.totalSsEmployer) },
    { key: 'totalTax', header: t('payroll.taxShort'), align: 'right', cell: (r) => m(r.totalTax) },
    { key: 'totalNet', header: t('payroll.net'), align: 'right', cell: (r) => <span className="font-medium">{m(r.totalNet)}</span> },
    { key: 'totalEmployerCost', header: t('payroll.employerCost'), align: 'right', cell: (r) => m(r.totalEmployerCost) },
  ];
  const exportIt = () => saveCsv(`payroll-${year}.csv`, [
    [t('payroll.period'), t('payroll.employees'), t('payroll.gross'), t('reports.ssEmployee'), t('reports.ssEmployer'), t('payroll.taxShort'), t('payroll.net'), t('payroll.employerCost')],
    ...rows.map((r) => [r.period, r.employeeCount, r.totalGross, r.totalSsEmployee, r.totalSsEmployer, r.totalTax, r.totalNet, r.totalEmployerCost]),
  ]);
  return (
    <>
      <Toolbar onExport={rows.length ? exportIt : undefined}>
        <Field label={t('leave.year')}><div className="w-32"><SelectInput value={year} onChange={setYear} options={[thisYear, thisYear - 1].map((y) => ({ value: String(y), label: String(y) }))} /></div></Field>
      </Toolbar>
      {!d ? <LoadingState rows={4} /> : (
        <>
          <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard tone="featured" icon={Wallet} label={t('reports.ytdCost')} value={<MoneyValue amount={total('totalEmployerCost')} symbol={cur.symbol} />} meta={t('reports.runsCounted', { n: rows.length })} />
            <DashboardCard icon={Wallet} label={t('reports.ytdNet')} value={<MoneyValue amount={total('totalNet')} symbol={cur.symbol} />} />
            <DashboardCard icon={Percent} label={t('reports.ytdTax')} value={<MoneyValue amount={total('totalTax')} symbol={cur.symbol} />} />
            <DashboardCard icon={Users} label={t('reports.ytdSs')} value={<MoneyValue amount={total('totalSsEmployee') + total('totalSsEmployer')} symbol={cur.symbol} />} meta={t('reports.ssBoth')} />
          </div>
          <div className="mb-6 grid gap-6 xl:grid-cols-3">
            <BarsChart className="xl:col-span-2" title={t('reports.costByMonth')} rows={rows} x="period" xFormat={monthShort} valueFormat={mil}
              series={[{ key: 'totalNet', label: t('payroll.net'), color: 'var(--chart-1)' }, { key: 'totalTax', label: t('payroll.taxShort'), color: 'var(--chart-2)' }, { key: 'totalSsEmployee', label: t('reports.ssEmployee'), color: 'var(--chart-3)' }, { key: 'totalSsEmployer', label: t('reports.ssEmployer'), color: 'var(--chart-4)' }]} />
            <RankedBars title={d.latestPeriod ? t('reports.costByDept', { period: formatPeriod(d.latestPeriod) }) : t('reports.costByDeptEmpty')} rows={d.byDepartment.map((x) => ({ label: localName(x), value: Math.round(x.employerCost / 100_000) / 10 }))} />
          </div>
          <Card>
            <DataTable columns={columns} rows={rows} total={rows.length} params={{ page: 1, pageSize: 50, sort: '' }} loading={q.loading} onSortChange={() => undefined} onPageChange={() => undefined} emptyTitle={t('reports.noPayroll')} />
          </Card>
          <p className="mt-3 text-body-sm text-ink-muted">{t('reports.millionsNote')} {t('payroll.sampleNote')}</p>
        </>
      )}
    </>
  );
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { can, user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const tabs = ['headcount', 'attendance', 'leave', ...(can('payroll.read') ? ['payroll'] : [])];
  const tab = tabs.includes(sp.get('tab') ?? '') ? sp.get('tab')! : tabs[0];
  const scopeAll = user?.scope === 'all';
  return (
    <>
      <PageHeader title={t('reports.title')} subtitle={scopeAll ? t('reports.subtitleAll') : t('reports.subtitleDept')} />
      <Tabs value={tab} onValueChange={(v) => setSp(() => new URLSearchParams({ tab: v }), { replace: true })}>
        <TabsList>{tabs.map((k) => <TabsTrigger key={k} value={k}>{t(`reports.tabs.${k}`)}</TabsTrigger>)}</TabsList>
        <TabsContent value="headcount"><HeadcountTab /></TabsContent>
        <TabsContent value="attendance"><AttendanceTab scopeAll={scopeAll} /></TabsContent>
        <TabsContent value="leave"><LeaveTab scopeAll={scopeAll} /></TabsContent>
        {tabs.includes('payroll') && <TabsContent value="payroll"><PayrollTab /></TabsContent>}
      </Tabs>
    </>
  );
}

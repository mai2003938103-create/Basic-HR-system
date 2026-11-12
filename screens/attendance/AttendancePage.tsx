import { Download, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { DataTable, type Column } from '../../components/common/DataTable';
import { FilterBar } from '../../components/common/FilterBar';
import { DatePicker, FilterDropdown } from '../../components/common/inputs';
import { PageHeader, PermissionGate } from '../../components/common/layout-bits';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/useAuth';
import { useDepartments } from '../../hooks/useDepartments';
import { cleanParams, useListQuery } from '../../hooks/useListQuery';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, type Page } from '../../lib/api';
import { downloadFile } from '../../lib/download';
import { toastError } from '../../lib/form-errors';
import { formatDate, formatMinutes, formatTime, fullName } from '../../lib/format';
import type { AttendanceRecord } from '../../lib/types';
import { AttendanceEditDialog } from './AttendanceEditDialog';
import { CheckInCard } from './CheckInCard';

const STATUSES = ['present', 'late', 'absent', 'half_day', 'leave'];

export function AttendancePage() {
  const { t, i18n } = useTranslation();
  const { can, user } = useAuth();
  const team = user?.scope !== 'self';
  const lq = useListQuery({ sort: 'workDate:desc', filters: ['from', 'to', 'status', 'departmentId'] });
  const q = useQuery(() => api.get<Page<AttendanceRecord>>('/attendance', { params: cleanParams(lq.params) }).then((r) => r.data), [lq.params]);
  const depts = useDepartments(user?.scope === 'all');
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  const manage = can('attendance.manage');

  const columns: Column<AttendanceRecord>[] = [
    { key: 'workDate', header: t('attendance.date'), sortable: true, cell: (r) => <span className="tabular">{formatDate(r.workDate)}</span> },
    ...(team ? [{ key: 'employee', header: t('attendance.employee'), cell: (r: AttendanceRecord) => <span><span className="block">{fullName(r.employee)}</span><span className="block text-body-sm text-ink-muted">{r.employee?.employeeCode} · {localName(r.department)}</span></span> }] : []),
    { key: 'checkInAt', header: t('attendance.checkInCol'), sortable: true, cell: (r) => <span className="tabular">{formatTime(r.checkInAt) || '—'}</span> },
    { key: 'checkOutAt', header: t('attendance.checkOutCol'), cell: (r) => <span className="tabular">{formatTime(r.checkOutAt) || '—'}</span> },
    { key: 'workedMinutes', header: t('attendance.worked'), align: 'right', cell: (r) => (r.workedMinutes ? formatMinutes(r.workedMinutes, i18n.language) : '—') },
    { key: 'lateMinutes', header: t('attendance.lateMin'), align: 'right', cell: (r) => (r.lateMinutes ? t('attendance.minutes', { n: r.lateMinutes }) : '—') },
    { key: 'status', header: t('common.status'), cell: (r) => <StatusBadge kind="attendance" value={r.status} /> },
    ...(manage ? [{ key: 'actions', header: '', cell: (r: AttendanceRecord) => <Button variant="subtle" size="iconSm" aria-label={`${t('common.edit')} ${fullName(r.employee)} ${formatDate(r.workDate)}`} onClick={() => setEditing(r)}><Pencil /></Button> }] : []),
  ];

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { page: _p, pageSize: _s, sort: _o, ...filters } = lq.params;
      await downloadFile('/attendance/export', { ...cleanParams(filters), lang: i18n.language }, `attendance-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      toastError(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader title={t('attendance.title')} />
      {can('attendance.check') && user?.employee && <div className="mb-6"><CheckInCard onChange={q.reload} /></div>}
      <Card>
        <CardHeader>
          <CardTitle>{t('attendance.history')}</CardTitle>
          {team && (
            <PermissionGate permission="attendance.manage">
              <Button variant="outline" onClick={exportCsv} loading={exporting}><Download />{t('attendance.exportCsv')}</Button>
            </PermissionGate>
          )}
        </CardHeader>
        <FilterBar activeCount={['from', 'to', 'status', 'departmentId'].filter((k) => lq.params[k]).length}>
          <label className="flex flex-col gap-1 text-body-sm text-ink-muted">{t('common.from')}<DatePicker className="w-full md:w-44" value={(lq.params.from as string) ?? ''} onChange={(e) => lq.setFilter('from', e.target.value || undefined)} /></label>
          <label className="flex flex-col gap-1 text-body-sm text-ink-muted">{t('common.to')}<DatePicker className="w-full md:w-44" value={(lq.params.to as string) ?? ''} onChange={(e) => lq.setFilter('to', e.target.value || undefined)} /></label>
          <FilterDropdown label={t('common.status')} value={lq.params.status as string | undefined} onChange={(v) => lq.setFilter('status', v)} allLabel={t('employees.allStatuses')} options={STATUSES.map((s) => ({ value: s, label: t(`status.attendance.${s}`) }))} />
          {user?.scope === 'all' && (
            <FilterDropdown label={t('employees.department')} value={lq.params.departmentId as string | undefined} onChange={(v) => lq.setFilter('departmentId', v)} allLabel={t('employees.allDepartments')} options={(depts.data ?? []).map((d) => ({ value: d.id, label: localName(d) }))} />
          )}
        </FilterBar>
        <DataTable
          columns={columns}
          rows={q.data?.data ?? []}
          total={q.data?.meta.total ?? 0}
          params={lq.params}
          loading={q.loading}
          error={q.error}
          onRetry={q.reload}
          onSortChange={lq.setSort}
          onPageChange={lq.setPage}
          emptyTitle={t('attendance.emptyTitle')}
          mobileCard={(r) => (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="tabular font-medium">{formatDate(r.workDate)}{team && <span className="font-normal text-ink-muted"> · {fullName(r.employee)}</span>}</p>
                <p className="tabular text-body-sm text-ink-muted">
                  {r.checkInAt ? `${formatTime(r.checkInAt)} – ${formatTime(r.checkOutAt) || '…'}` : t('attendance.noCheckIn')}
                  {r.workedMinutes ? ` · ${formatMinutes(r.workedMinutes, i18n.language)}` : ''}
                  {r.lateMinutes ? <span className="text-warning-text"> · {t('attendance.lateBy', { n: r.lateMinutes })}</span> : null}
                </p>
              </div>
              <StatusBadge kind="attendance" value={r.status} />
              {manage && <Button variant="subtle" size="iconSm" aria-label={`${t('common.edit')} ${fullName(r.employee)} ${formatDate(r.workDate)}`} onClick={() => setEditing(r)}><Pencil /></Button>}
            </div>
          )}
        />
      </Card>
      <AttendanceEditDialog record={editing} onOpenChange={(o) => !o && setEditing(null)} onSaved={q.reload} />
    </>
  );
}

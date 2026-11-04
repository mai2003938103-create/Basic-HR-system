import { Check, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable, type Column } from '../../components/common/DataTable';
import { cn } from '@/lib/utils';
import { FilterBar } from '../../components/common/FilterBar';
import { FilterDropdown } from '../../components/common/inputs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { cleanParams, useListQuery } from '../../hooks/useListQuery';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, type Page } from '../../lib/api';
import { downloadFile } from '../../lib/download';
import { toastError } from '../../lib/form-errors';
import { formatDate, fullName } from '../../lib/format';
import type { LeaveRequest } from '../../lib/types';

type Mode = 'mine' | 'approvals' | 'all';

export function LeaveRequestList({ mode, refreshKey, onChanged }: { mode: Mode; refreshKey: number; onChanged: () => void }) {
  const { t } = useTranslation();
  const lq = useListQuery({ sort: mode === 'approvals' ? 'startDate:asc' : 'createdAt:desc', filters: mode === 'approvals' ? [] : ['status'] });
  const extra = mode === 'mine' ? { mine: 'true' } : mode === 'approvals' ? { toApprove: 'true' } : {};
  const q = useQuery(() => api.get<Page<LeaveRequest>>('/leave-requests', { params: { ...cleanParams(lq.params), ...extra } }).then((r) => r.data), [lq.params, mode, refreshKey]);
  const [action, setAction] = useState<{ kind: 'approve' | 'reject' | 'cancel'; req: LeaveRequest } | null>(null);

  const run = async (reason?: string) => {
    if (!action) return;
    try {
      await api.put(`/leave-requests/${action.req.id}/${action.kind}`, action.kind === 'cancel' ? undefined : { note: reason });
      toast.success(t(action.kind === 'approve' ? 'leave.approvedToast' : action.kind === 'reject' ? 'leave.rejectedToast' : 'leave.cancelledToast'));
      void q.reload();
      onChanged();
    } catch (e) {
      toastError(e);
      void q.reload();
    }
  };

  /** Row actions, shared by the table (right-aligned) and the phone cards (left-aligned). */
  const actions = (r: LeaveRequest, align: 'start' | 'end' = 'end') => (
    <div className={cn('flex flex-wrap gap-1', align === 'end' ? 'justify-end' : 'justify-start')}>
      {r.documentUrl && (
        <Button variant="subtle" size="iconSm" aria-label={t('leave.document')} onClick={() => downloadFile(r.documentUrl!.replace(/^\/api/, ''), {}, `leave-${r.id}`).catch(toastError)}>
          <FileText />
        </Button>
      )}
      {r.canApprove && (
        <>
          <Button size="sm" onClick={() => setAction({ kind: 'approve', req: r })}><Check />{t('leave.approve')}</Button>
          <Button size="sm" variant="outline" onClick={() => setAction({ kind: 'reject', req: r })}><X />{t('leave.reject')}</Button>
        </>
      )}
      {r.canCancel && mode !== 'approvals' && <Button size="sm" variant="ghost" onClick={() => setAction({ kind: 'cancel', req: r })}>{t('leave.cancel')}</Button>}
    </div>
  );

  const columns: Column<LeaveRequest>[] = [
    ...(mode !== 'mine' ? [{ key: 'employee', header: t('leave.employee'), cell: (r: LeaveRequest) => <span><span className="block">{fullName(r.employee)}</span><span className="block text-body-sm text-ink-muted">{r.employee.employeeCode}</span></span> }] : []),
    { key: 'leaveType', header: t('leave.type'), cell: (r) => localName(r.leaveType) },
    { key: 'startDate', header: t('leave.startDate'), sortable: true, cell: (r) => <span className="tabular">{formatDate(r.startDate)}{r.endDate !== r.startDate ? ` – ${formatDate(r.endDate)}` : ''}{r.halfDay !== 'none' ? ` (${t(r.halfDay === 'morning' ? 'leave.halfMorning' : 'leave.halfAfternoon')})` : ''}</span> },
    { key: 'days', header: t('leave.days'), align: 'right', cell: (r) => r.days },
    { key: 'reason', header: t('leave.reason'), cell: (r) => <span className="line-clamp-2 max-w-[260px]" title={r.reason}>{r.reason}{r.decisionNote ? <span className="block text-body-sm text-ink-muted">{t('leave.decisionNote')}: {r.decisionNote}</span> : null}</span> },
    { key: 'status', header: t('common.status'), cell: (r) => <StatusBadge kind="leave" value={r.status} /> },
    { key: 'actions', header: '', cell: (r) => actions(r) },
  ];

  return (
    <Card>
      {mode !== 'approvals' && (
        <FilterBar activeCount={lq.params.status ? 1 : 0}>
          <FilterDropdown label={t('common.status')} value={lq.params.status as string | undefined} onChange={(v) => lq.setFilter('status', v)} allLabel={t('employees.allStatuses')} options={['pending', 'approved', 'rejected', 'cancelled'].map((s) => ({ value: s, label: t(`status.leave.${s}`) }))} />
        </FilterBar>
      )}
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
        emptyTitle={mode === 'approvals' ? t('leave.noPending') : t('leave.emptyTitle')}
        mobileCard={(r) => (
          <div className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{mode !== 'mine' ? `${fullName(r.employee)} · ` : ''}{localName(r.leaveType)}</p>
                <p className="tabular text-body-sm text-ink-muted">
                  {formatDate(r.startDate)}{r.endDate !== r.startDate ? ` – ${formatDate(r.endDate)}` : ''} · {t('leave.daysN', { n: r.days })}
                </p>
              </div>
              <StatusBadge kind="leave" value={r.status} />
            </div>
            <p className="line-clamp-2 text-body-sm">{r.reason}</p>
            {r.decisionNote && <p className="text-body-sm text-ink-muted">{t('leave.decisionNote')}: {r.decisionNote}</p>}
            {(r.documentUrl || r.canApprove || (r.canCancel && mode !== 'approvals')) && actions(r, 'start')}
          </div>
        )}
      />
      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        title={action?.kind === 'reject' ? t('leave.rejectTitle') : action?.kind === 'approve' ? t('leave.confirmApprove') : t('leave.confirmCancel')}
        description={action ? `${fullName(action.req.employee)} · ${localName(action.req.leaveType)} · ${formatDate(action.req.startDate)} – ${formatDate(action.req.endDate)}` : undefined}
        confirmLabel={action?.kind === 'reject' ? t('leave.reject') : action?.kind === 'approve' ? t('leave.approve') : t('leave.cancel')}
        tone={action?.kind === 'approve' ? 'primary' : 'danger'}
        requireReason={action?.kind === 'reject'}
        reasonLabel={t('leave.rejectReason')}
        onConfirm={run}
      />
    </Card>
  );
}

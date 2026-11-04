import { ArrowRight, Check, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ErrorState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, apiError, type Page } from '../../lib/api';
import { toastError } from '../../lib/form-errors';
import { formatDate, fullName } from '../../lib/format';
import type { LeaveRequest } from '../../lib/types';
import { Avatar } from '../employees/Avatar';

/** Leave requests waiting for this user, decided in place (reject asks for a reason). */
export function ApprovalsCard({ onDecided }: { onDecided?: () => void }) {
  const { t } = useTranslation();
  const q = useQuery(() => api.get<Page<LeaveRequest>>('/leave-requests', { params: { toApprove: 'true', pageSize: 5, sort: 'startDate:asc' } }).then((r) => r.data), []);
  const [action, setAction] = useState<{ kind: 'approve' | 'reject'; req: LeaveRequest } | null>(null);
  const total = q.data?.meta.total ?? 0;

  const run = async (reason?: string) => {
    if (!action) return;
    try {
      await api.put(`/leave-requests/${action.req.id}/${action.kind}`, { note: reason });
      toast.success(t(action.kind === 'approve' ? 'leave.approvedToast' : 'leave.rejectedToast'));
      onDecided?.();
    } catch (e) {
      toastError(e);
    } finally {
      void q.reload();
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-subhead">
          {t('dashboard.waitingForYou')}
          {total > 0 && <span className="tabular rounded-pill bg-warning-tint px-2 text-caption text-warning-text">{total}</span>}
        </CardTitle>
        {total > 0 && <Button variant="ghost" size="sm" asChild><Link to="/leave?tab=approvals">{t('common.viewAll')}<ArrowRight /></Link></Button>}
      </CardHeader>
      {q.error ? <ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} /> : !q.data ? <LoadingState rows={3} /> : q.data.data.length === 0 ? (
        <p className="flex flex-1 items-center gap-2 px-6 py-8 text-body-sm text-ink-muted"><CheckCircle2 className="size-5 text-success" aria-hidden />{t('dashboard.nothingWaiting')}</p>
      ) : (
        <ul className="divide-y divide-border px-6 pb-2 pt-2">
          {q.data.data.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar employee={{ ...r.employee, photoUrl: null }} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{fullName(r.employee)} <span className="font-normal text-ink-muted">· {localName(r.leaveType)}</span></p>
                <p className="tabular truncate text-body-sm text-ink-muted" title={r.reason}>
                  {formatDate(r.startDate)}{r.endDate !== r.startDate ? ` – ${formatDate(r.endDate)}` : ''} · {t('leave.daysN', { n: r.days })} · {r.reason}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" onClick={() => setAction({ kind: 'approve', req: r })}><Check />{t('leave.approve')}</Button>
                <Button size="sm" variant="outline" aria-label={`${t('leave.reject')} ${fullName(r.employee)}`} onClick={() => setAction({ kind: 'reject', req: r })}><X /><span className="hidden sm:inline">{t('leave.reject')}</span></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        title={action?.kind === 'reject' ? t('leave.rejectTitle') : t('leave.confirmApprove')}
        description={action ? `${fullName(action.req.employee)} · ${localName(action.req.leaveType)} · ${formatDate(action.req.startDate)} – ${formatDate(action.req.endDate)}` : undefined}
        confirmLabel={action?.kind === 'reject' ? t('leave.reject') : t('leave.approve')}
        tone={action?.kind === 'reject' ? 'danger' : 'primary'}
        requireReason={action?.kind === 'reject'}
        reasonLabel={t('leave.rejectReason')}
        onConfirm={run}
      />
    </Card>
  );
}

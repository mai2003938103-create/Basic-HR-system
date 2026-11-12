import { CalendarOff, CheckCircle2, LogIn, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ErrorState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useQuery } from '../../hooks/useQuery';
import { useSettings } from '../../hooks/useSettings';
import { api, apiError } from '../../lib/api';
import { formatDate, formatMinutes, formatTime } from '../../lib/format';
import type { AttendanceRecord } from '../../lib/types';

interface Today {
  date: string;
  isWorkingDay: boolean;
  onLeave: boolean;
  record: AttendanceRecord | null;
}

/** `stacked`: clock above status, for narrow slots such as a dashboard column; the default goes side by side from 640px. */
export function CheckInCard({ onChange, stacked = false }: { onChange?: () => void; stacked?: boolean }) {
  const { t, i18n } = useTranslation();
  const settings = useSettings();
  const q = useQuery(() => api.get<{ data: Today }>('/attendance/today').then((r) => r.data.data), []);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const act = async (kind: 'check-in' | 'check-out') => {
    if (inFlight.current) return; // a second click while the first request runs does nothing
    inFlight.current = true;
    setBusy(true);
    try {
      const r = await api.post<{ data: AttendanceRecord }>(`/attendance/${kind}`);
      q.setData((d) => (d ? { ...d, record: r.data.data } : d));
      toast.success(t(kind === 'check-in' ? 'attendance.checkedIn' : 'attendance.checkedOut'));
      onChange?.();
    } catch (e) {
      toast.error(t(apiError(e).messageKey));
      void q.reload();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  if (q.loading && !q.data) return <Card><LoadingState rows={2} /></Card>;
  if (q.error && !q.data) return <Card><ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} /></Card>;
  const d = q.data;
  const rec = d?.record;

  return (
    // Phones: one column with a full-width action; wider screens: clock left, action right.
    <Card className={cn('grid', stacked ? 'gap-3 p-5' : 'gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-6')}>
      <div className="min-w-0">
        <p className="text-label text-ink-muted">{t('attendance.myToday')} · {formatDate(d?.date ?? '')}</p>
        <p className={cn('tabular text-primary-hover', stacked ? 'text-stat-value' : 'text-clock')}>{formatTime(now)}</p>
        {settings && <p className="text-body-sm text-ink-muted">{t('attendance.workHours', { start: settings.workStart, end: settings.workEnd })}</p>}
      </div>
      <div className={cn('flex flex-col', stacked ? 'items-start gap-1.5 text-body-sm' : 'gap-2 sm:min-w-[220px] sm:items-start')}>
        {rec?.checkInAt && <p className={stacked ? undefined : 'text-body'}>{t('attendance.checkedInAt', { time: formatTime(rec.checkInAt) })} {rec.status !== 'leave' && <StatusBadge kind="attendance" value={rec.status} className="ml-1" />}</p>}
        {rec?.checkOutAt && <p className={stacked ? undefined : 'text-body'}>{t('attendance.checkedOutAt', { time: formatTime(rec.checkOutAt) })} · {formatMinutes(rec.workedMinutes, i18n.language)}</p>}
        {d?.onLeave ? (
          <p className="inline-flex items-center gap-2 rounded-pill bg-primary-tint px-4 py-2 text-label text-primary-hover"><CalendarOff className="size-4" />{t('attendance.onLeaveToday')}</p>
        ) : !rec?.checkInAt ? (
          <>
            {!d?.isWorkingDay && <p className="text-body-sm text-ink-muted">{t('attendance.notWorkingDay')}</p>}
            <Button className={cn('w-full px-8 text-subhead sm:w-auto', stacked ? 'mt-1 h-11' : 'h-12')} onClick={() => act('check-in')} disabled={busy} loading={busy}><LogIn />{t('attendance.checkIn')}</Button>
          </>
        ) : !rec.checkOutAt ? (
          <Button variant="outline" className={cn('w-full px-8 text-subhead sm:w-auto', stacked ? 'mt-1 h-11' : 'h-12')} onClick={() => act('check-out')} disabled={busy} loading={busy}><LogOut />{t('attendance.checkOut')}</Button>
        ) : (
          <p className={cn('inline-flex items-center gap-2 rounded-pill bg-success-tint text-label text-success-text', stacked ? 'mt-1 px-3 py-1' : 'px-4 py-2')}><CheckCircle2 className="size-4" />{t('attendance.done')}</p>
        )}
      </div>
    </Card>
  );
}

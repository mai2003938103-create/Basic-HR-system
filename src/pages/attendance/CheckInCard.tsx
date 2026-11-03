import { CalendarOff, CheckCircle2, LogIn, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
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

export function CheckInCard({ onChange }: { onChange?: () => void }) {
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
  const d = q.data;
  const rec = d?.record;

  return (
    <Card className="flex flex-wrap items-center gap-6 p-6">
      <div className="min-w-0 flex-1">
        <p className="text-label text-ink-muted">{t('attendance.myToday')} · {formatDate(d?.date ?? '')}</p>
        <p className="tabular text-[40px] font-bold leading-[48px] text-primary-hover">{formatTime(now)}</p>
        {settings && <p className="text-body-sm text-ink-muted">{t('attendance.workHours', { start: settings.workStart, end: settings.workEnd })}</p>}
      </div>
      <div className="flex min-w-[220px] flex-col items-start gap-2">
        {rec?.checkInAt && <p className="text-body">{t('attendance.checkedInAt', { time: formatTime(rec.checkInAt) })} {rec.status !== 'leave' && <StatusBadge kind="attendance" value={rec.status} className="ml-1" />}</p>}
        {rec?.checkOutAt && <p className="text-body">{t('attendance.checkedOutAt', { time: formatTime(rec.checkOutAt) })} · {formatMinutes(rec.workedMinutes, i18n.language)}</p>}
        {d?.onLeave ? (
          <p className="inline-flex items-center gap-2 rounded-pill bg-primary-tint px-4 py-2 text-label text-primary-hover"><CalendarOff className="size-4" />{t('attendance.onLeaveToday')}</p>
        ) : !rec?.checkInAt ? (
          <>
            {!d?.isWorkingDay && <p className="text-body-sm text-ink-muted">{t('attendance.notWorkingDay')}</p>}
            <Button className="h-12 px-8 text-[16px]" onClick={() => act('check-in')} disabled={busy} loading={busy}><LogIn />{t('attendance.checkIn')}</Button>
          </>
        ) : !rec.checkOutAt ? (
          <Button variant="outline" className="h-12 px-8 text-[16px]" onClick={() => act('check-out')} disabled={busy} loading={busy}><LogOut />{t('attendance.checkOut')}</Button>
        ) : (
          <p className="inline-flex items-center gap-2 rounded-pill bg-success-tint px-4 py-2 text-label text-success-text"><CheckCircle2 className="size-4" />{t('attendance.done')}</p>
        )}
      </div>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { Button } from '../../components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input, Textarea } from '../../components/ui/input';
import { FormField } from '../../components/common/FormField';
import { api, apiError } from '../../lib/api';
import { TZ, formatDate, fullName } from '../../lib/format';
import type { AttendanceRecord } from '../../lib/types';

const toLocal = (iso: string | null) => (iso ? formatInTimeZone(iso, TZ, 'HH:mm') : '');
const toIso = (date: string, hhmm: string) => (hhmm ? fromZonedTime(`${date}T${hhmm}:00`, TZ).toISOString() : null);

export function AttendanceEditDialog({ record, onOpenChange, onSaved }: { record: AttendanceRecord | null; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (record) {
      setCheckIn(toLocal(record.checkInAt));
      setCheckOut(toLocal(record.checkOutAt));
      setNote(record.note && record.note !== 'leave' ? record.note : '');
      setErrors({});
    }
  }, [record]);

  const save = async () => {
    if (!record) return;
    if (!note.trim()) return setErrors({ note: 'errors.attendance.noteRequired' });
    setBusy(true);
    try {
      await api.put(`/attendance/${record.id}`, { checkInAt: toIso(record.workDate, checkIn), checkOutAt: toIso(record.workDate, checkOut), note: note.trim() });
      toast.success(t('common.saved'));
      onOpenChange(false);
      onSaved();
    } catch (e) {
      const err = apiError(e);
      if (Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else toast.error(t(err.messageKey));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('attendance.editTitle')}</DialogTitle>
          <DialogDescription>{record && `${fullName(record.employee)} · ${formatDate(record.workDate)}`}</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('attendance.checkInCol')} error={errors.checkInAt}><Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></FormField>
          <FormField label={t('attendance.checkOutCol')} error={errors.checkOutAt}><Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></FormField>
          <FormField label={t('common.reason')} required error={errors.note} className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={save} loading={busy}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

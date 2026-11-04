import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/input';
import { FormField } from '../../components/common/FormField';
import { DatePicker, FileInput, SelectInput } from '../../components/common/inputs';
import { useQuery } from '../../hooks/useQuery';
import { useSettings } from '../../hooks/useSettings';
import { localName } from '../../i18n';
import { api, apiError } from '../../lib/api';
import { countWorkingDays } from '../../lib/workdays';
import type { Holiday, LeaveBalance, LeaveType } from '../../lib/types';

type Errors = Partial<Record<'leaveTypeId' | 'startDate' | 'endDate' | 'reason' | 'document' | 'halfDay', string>>;

export function LeaveRequestForm({ open, onOpenChange, types, balances, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; types: LeaveType[]; balances: LeaveBalance[]; onSaved: () => void }) {
  const { t } = useTranslation();
  const settings = useSettings();
  const [leaveTypeId, setType] = useState('');
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const [halfDay, setHalf] = useState('none');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setType(''); setStart(''); setEnd(''); setHalf('none'); setReason(''); setFile(null); setErrors({});
    }
  }, [open]);
  useEffect(() => {
    if (startDate !== endDate) setHalf('none');
  }, [startDate, endDate]);

  const years = useMemo(() => [...new Set([startDate, endDate].filter(Boolean).map((d) => d.slice(0, 4)))], [startDate, endDate]);
  const holidays = useQuery(
    () => Promise.all(years.map((y) => api.get<{ data: Holiday[] }>('/holidays', { params: { year: y } }).then((r) => r.data.data))).then((l) => new Set(l.flat().map((h) => h.date))),
    [years],
    years.length > 0,
  );
  const type = types.find((x) => x.id === leaveTypeId);
  const days = countWorkingDays(startDate, endDate, settings?.workingDays ?? [1, 2, 3, 4, 5], holidays.data ?? new Set(), halfDay);
  const needsDoc = !!type && type.documentRequiredAfterDays !== null && days > type.documentRequiredAfterDays;
  const balance = balances.find((b) => b.leaveType.id === leaveTypeId);

  const submit = async () => {
    const e: Errors = {};
    if (!leaveTypeId) e.leaveTypeId = 'errors.leave.invalidType';
    if (!startDate) e.startDate = 'errors.validation.required';
    if (!endDate) e.endDate = 'errors.validation.required';
    if (startDate && endDate && endDate < startDate) e.endDate = 'errors.leave.invalidRange';
    if (!reason.trim()) e.reason = 'errors.validation.required';
    if (needsDoc && !file) e.document = 'errors.leave.documentRequired';
    if (file && file.size > 5 * 1024 * 1024) e.document = 'errors.upload.tooLarge';
    setErrors(e);
    if (Object.keys(e).length) return;
    const fd = new FormData();
    fd.append('leaveTypeId', leaveTypeId);
    fd.append('startDate', startDate);
    fd.append('endDate', endDate);
    fd.append('halfDay', halfDay);
    fd.append('reason', reason.trim());
    if (file) fd.append('document', file);
    setBusy(true);
    try {
      await api.post('/leave-requests', fd);
      toast.success(t('leave.submitted'));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const info = apiError(err);
      if (Object.keys(info.fieldErrors).length) setErrors(info.fieldErrors as Errors);
      else toast.error(t(info.messageKey));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent wide>
        <DialogHeader>
          <DialogTitle>{t('leave.request')}</DialogTitle>
          <DialogDescription className="sr-only">{t('leave.request')}</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('leave.type')} required error={errors.leaveTypeId} className="sm:col-span-2" hint={balance && type?.isPaid ? `${t('leave.remaining')}: ${balance.remainingDays}` : type && !type.isPaid ? t('leave.unpaid') : undefined}>
            <SelectInput value={leaveTypeId} onChange={setType} options={types.filter((x) => x.isActive).map((x) => ({ value: x.id, label: localName(x) }))} />
          </FormField>
          <FormField label={t('leave.startDate')} required error={errors.startDate}><DatePicker value={startDate} onChange={(e) => setStart(e.target.value)} /></FormField>
          <FormField label={t('leave.endDate')} required error={errors.endDate}><DatePicker value={endDate} min={startDate || undefined} onChange={(e) => setEnd(e.target.value)} /></FormField>
          {startDate && startDate === endDate && (
            <FormField label={t('leave.halfDay')}>
              <SelectInput value={halfDay} onChange={setHalf} options={[{ value: 'none', label: t('leave.halfNone') }, { value: 'morning', label: t('leave.halfMorning') }, { value: 'afternoon', label: t('leave.halfAfternoon') }]} />
            </FormField>
          )}
          {startDate && endDate && endDate >= startDate && (
            <p role="status" className="self-end rounded-sm bg-primary-tint px-3 py-2 text-body-sm text-primary-hover sm:col-span-2">{t('leave.preview', { n: days })}</p>
          )}
          <FormField label={t('leave.reason')} required error={errors.reason} className="sm:col-span-2"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} /></FormField>
          <FormField label={t('leave.document')} required={needsDoc} error={errors.document} className="sm:col-span-2" hint={type?.documentRequiredAfterDays != null ? t('leave.documentHint', { n: type.documentRequiredAfterDays }) : undefined}>
            <FileInput accept="application/pdf,image/jpeg,image/png" file={file} onChange={setFile} />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={submit} loading={busy}>{t('common.submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

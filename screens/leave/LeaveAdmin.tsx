import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { FormField } from '../../components/common/FormField';
import { DatePicker } from '../../components/common/inputs';
import { LoadingState } from '../../components/common/LoadingState';
import { RowActions } from '../../components/common/RowActions';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, apiError } from '../../lib/api';
import { toastError } from '../../lib/form-errors';
import { formatDate } from '../../lib/format';
import type { Holiday, LeaveType } from '../../lib/types';

type TypeForm = { code: string; nameLo: string; nameEn: string; defaultDaysPerYear: string; isPaid: boolean; documentRequiredAfterDays: string; isActive: boolean };

export function LeaveTypesAdmin({ types, onChanged }: { types: LeaveType[]; onChanged: () => void }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<LeaveType | null | undefined>(undefined);
  const [f, setF] = useState<TypeForm>({ code: '', nameLo: '', nameEn: '', defaultDaysPerYear: '0', isPaid: true, documentRequiredAfterDays: '', isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const open = (lt: LeaveType | null) => {
    setEditing(lt);
    setErrors({});
    setF(lt ? { code: lt.code, nameLo: lt.nameLo, nameEn: lt.nameEn, defaultDaysPerYear: String(lt.defaultDaysPerYear), isPaid: lt.isPaid, documentRequiredAfterDays: lt.documentRequiredAfterDays?.toString() ?? '', isActive: lt.isActive } : { code: '', nameLo: '', nameEn: '', defaultDaysPerYear: '0', isPaid: true, documentRequiredAfterDays: '', isActive: true });
  };
  const save = async () => {
    const e: Record<string, string> = {};
    for (const k of ['code', 'nameLo', 'nameEn'] as const) if (!f[k].trim()) e[k] = 'errors.validation.required';
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { ...f, defaultDaysPerYear: Number(f.defaultDaysPerYear || 0), documentRequiredAfterDays: f.documentRequiredAfterDays === '' ? null : Number(f.documentRequiredAfterDays) };
    setBusy(true);
    try {
      if (editing) await api.put(`/leave-types/${editing.id}`, body);
      else await api.post('/leave-types', body);
      toast.success(t('common.saved'));
      setEditing(undefined);
      onChanged();
    } catch (err) {
      const info = apiError(err);
      if (info.messageKey === 'errors.common.duplicate') setErrors({ code: info.messageKey });
      else if (Object.keys(info.fieldErrors).length) setErrors(info.fieldErrors);
      else toast.error(t(info.messageKey));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex justify-end p-4"><Button onClick={() => open(null)}><Plus />{t('leave.addType')}</Button></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="bg-surface-sunken text-caption text-ink-muted">
            <th className="px-6 py-3">{t('departments.code')}</th><th className="px-4 py-3">{t('leave.type')}</th><th className="px-4 py-3 text-right">{t('leave.defaultDays')}</th>
            <th className="px-4 py-3">{t('leave.isPaid')}</th><th className="px-4 py-3">{t('common.status')}</th><th className="px-6 py-3" />
          </tr></thead>
          <tbody>
            {types.map((lt) => (
              <tr key={lt.id} className="border-t border-border">
                <td className="px-6 py-3 font-medium">{lt.code}</td><td className="px-4 py-3">{localName(lt)}</td><td className="tabular px-4 py-3 text-right">{lt.defaultDaysPerYear}</td>
                <td className="px-4 py-3">{lt.isPaid ? t('common.yes') : t('common.no')}</td><td className="px-4 py-3"><StatusBadge kind="account" value={lt.isActive ? 'active' : 'inactive'} /></td>
                <td className="px-6 py-3"><RowActions name={localName(lt)} onEdit={() => open(lt)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t('common.edit') : t('leave.addType')}</DialogTitle><DialogDescription className="sr-only">{t('leave.types')}</DialogDescription></DialogHeader>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('departments.code')} required error={errors.code}><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} disabled={!!editing} /></FormField>
            <FormField label={t('leave.defaultDays')} error={errors.defaultDaysPerYear}><Input type="number" min={0} max={366} step={0.5} value={f.defaultDaysPerYear} onChange={(e) => setF({ ...f, defaultDaysPerYear: e.target.value })} /></FormField>
            <FormField label={t('departments.nameLo')} required error={errors.nameLo}><Input value={f.nameLo} onChange={(e) => setF({ ...f, nameLo: e.target.value })} /></FormField>
            <FormField label={t('departments.nameEn')} required error={errors.nameEn}><Input value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} /></FormField>
            <FormField label={t('leave.docAfter')} hint={t('common.optional')}><Input type="number" min={0} value={f.documentRequiredAfterDays} onChange={(e) => setF({ ...f, documentRequiredAfterDays: e.target.value })} /></FormField>
            <div className="flex flex-col justify-end gap-3">
              <label className="flex items-center gap-2 text-label"><Checkbox checked={f.isPaid} onCheckedChange={(v) => setF({ ...f, isPaid: v === true })} />{t('leave.isPaid')}</label>
              <label className="flex items-center gap-2 text-label"><Checkbox checked={f.isActive} onCheckedChange={(v) => setF({ ...f, isActive: v === true })} />{t('common.active')}</label>
            </div>
          </DialogBody>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(undefined)}>{t('common.cancel')}</Button><Button onClick={save} loading={busy}>{t('common.save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function HolidaysAdmin() {
  const { t } = useTranslation();
  const [year, setYear] = useState(new Date().getFullYear());
  const q = useQuery(() => api.get<{ data: Holiday[] }>('/holidays', { params: { year } }).then((r) => r.data.data), [year]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ date: '', nameLo: '', nameEn: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const e: Record<string, string> = {};
    for (const k of ['date', 'nameLo', 'nameEn'] as const) if (!form[k].trim()) e[k] = 'errors.validation.required';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.post('/holidays', form);
      toast.success(t('common.saved'));
      setAdding(false);
      setForm({ date: '', nameLo: '', nameEn: '' });
      if (form.date.startsWith(String(year))) void q.reload();
      else setYear(Number(form.date.slice(0, 4)));
    } catch (err) {
      const info = apiError(err);
      if (info.messageKey === 'errors.common.duplicate') setErrors({ date: info.messageKey });
      else toast.error(t(info.messageKey));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(year - 1)} aria-label={t('common.previous')}>‹</Button>
          <span className="tabular min-w-[4ch] text-center text-subhead">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear(year + 1)} aria-label={t('common.next')}>›</Button>
        </div>
        <Button onClick={() => { setErrors({}); setAdding(true); }}><Plus />{t('leave.addHoliday')}</Button>
      </div>
      {q.loading ? <LoadingState rows={3} /> : (q.data ?? []).length === 0 ? <EmptyState title={t('common.emptyTitle')} /> : (
        <ul className="divide-y divide-border">
          {q.data!.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 px-6 py-3">
              <span><span className="tabular mr-3 font-medium">{formatDate(h.date)}</span>{localName(h)}</span>
              <Button variant="subtle" size="iconSm" aria-label={`${t('common.delete')} ${localName(h)}`} onClick={() => setDeleting(h)}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('leave.addHoliday')}</DialogTitle><DialogDescription className="sr-only">{t('leave.holidays')}</DialogDescription></DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <FormField label={t('leave.holidayDate')} required error={errors.date}><DatePicker value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FormField>
            <FormField label={t('departments.nameLo')} required error={errors.nameLo}><Input value={form.nameLo} onChange={(e) => setForm({ ...form, nameLo: e.target.value })} /></FormField>
            <FormField label={t('departments.nameEn')} required error={errors.nameEn}><Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></FormField>
          </DialogBody>
          <DialogFooter><Button variant="outline" onClick={() => setAdding(false)}>{t('common.cancel')}</Button><Button onClick={add} loading={busy}>{t('common.save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`${t('common.delete')} ${deleting ? localName(deleting) : ''}?`}
        confirmLabel={t('common.delete')}
        tone="danger"
        onConfirm={async () => {
          try { await api.delete(`/holidays/${deleting!.id}`); toast.success(t('common.deleted')); void q.reload(); } catch (e) { toastError(e); }
        }}
      />
    </Card>
  );
}

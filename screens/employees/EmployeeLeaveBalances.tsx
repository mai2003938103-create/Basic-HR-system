import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { FormField } from '../../components/common/FormField';
import { SectionTab } from '../../components/common/layout-bits';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api } from '../../lib/api';
import { toastError } from '../../lib/form-errors';
import type { LeaveBalance } from '../../lib/types';

/** HR view of one employee's leave balances for a year, with entitlement adjustment. */
export function EmployeeLeaveBalances({ employeeId }: { employeeId: string }) {
  const { t } = useTranslation();
  const [year, setYear] = useState(new Date().getFullYear());
  const q = useQuery(() => api.get<{ data: LeaveBalance[] }>('/leave-balances', { params: { employeeId, year } }).then((r) => r.data.data), [employeeId, year]);
  const [editing, setEditing] = useState<LeaveBalance | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await api.put(`/leave-balances/${editing.id}`, { entitledDays: Number(value) });
      toast.success(t('common.saved'));
      setEditing(null);
      void q.reload();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden pt-6 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
        <SectionTab>{t('leave.balances')}</SectionTab>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" aria-label={t('common.previous')} onClick={() => setYear(year - 1)}>‹</Button>
          <span className="tabular text-label">{year}</span>
          <Button variant="outline" size="sm" aria-label={t('common.next')} onClick={() => setYear(year + 1)}>›</Button>
        </div>
      </div>
      <div className="overflow-x-auto p-6">
        <table className="w-full text-left">
          <thead><tr className="bg-surface-sunken text-caption text-ink-muted">
            <th className="px-4 py-2">{t('leave.type')}</th><th className="px-4 py-2 text-right">{t('leave.entitled')}</th>
            <th className="px-4 py-2 text-right">{t('leave.used')}</th><th className="px-4 py-2 text-right">{t('leave.remaining')}</th><th className="px-4 py-2" />
          </tr></thead>
          <tbody>
            {(q.data ?? []).map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-2">{localName(b.leaveType)}</td>
                <td className="tabular px-4 py-2 text-right">{b.entitledDays}</td>
                <td className="tabular px-4 py-2 text-right">{b.usedDays}</td>
                <td className="tabular px-4 py-2 text-right font-semibold">{b.remainingDays}</td>
                <td className="px-4 py-2 text-right">
                  <Button variant="subtle" size="iconSm" aria-label={`${t('leave.editEntitlement')} ${localName(b.leaveType)}`} onClick={() => { setEditing(b); setValue(String(b.entitledDays)); }}><Pencil /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leave.editEntitlement')}</DialogTitle>
            <DialogDescription>{editing && `${localName(editing.leaveType)} · ${year}`}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FormField label={t('leave.entitled')}><Input type="number" min={0} max={366} step={0.5} value={value} onChange={(e) => setValue(e.target.value)} /></FormField>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button onClick={save} loading={busy} disabled={value === '' || Number(value) < 0}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

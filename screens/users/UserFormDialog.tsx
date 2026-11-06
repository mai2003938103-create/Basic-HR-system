import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { FormField } from '../../components/common/FormField';
import { SelectInput } from '../../components/common/inputs';
import { useAuth } from '../../auth/useAuth';
import { useQuery } from '../../hooks/useQuery';
import { api, apiError, type Page } from '../../lib/api';
import { fullName } from '../../lib/format';
import { localName } from '../../i18n';
import type { Employee, UserRow } from '../../lib/types';
import { newPasswordSchema } from '../auth/passwordSchema';

const NONE = '__none__';

export function UserFormDialog({ open, onOpenChange, user, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; user?: UserRow | null; onSaved: () => void }) {
  const { t } = useTranslation();
  const { can } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [employeeId, setEmployeeId] = useState(NONE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const employees = useQuery(() => api.get<Page<Employee>>('/employees', { params: { pageSize: 100, sort: 'firstName:asc' } }).then((r) => r.data.data), [open], open && can('employee.read'));
  const assignable = useQuery(() => api.get<{ data: { code: string; nameLo: string; nameEn: string }[] }>('/roles/assignable').then((r) => r.data.data), [open], open);

  useEffect(() => {
    if (open) {
      setEmail(user?.email ?? '');
      setPassword('');
      setRoles(user?.roles ?? ['employee']);
      setEmployeeId(user?.employeeId ?? NONE);
      setErrors({});
    }
  }, [open, user]);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'errors.validation.email';
    if (!user && !newPasswordSchema.safeParse(password).success) e.password = 'errors.password.weak';
    if (!roles.length) e.roleCodes = 'errors.validation.required';
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { email: email.trim(), roleCodes: roles, employeeId: employeeId === NONE ? null : employeeId, ...(user ? {} : { password }) };
    setBusy(true);
    try {
      if (user) await api.put(`/users/${user.id}`, body);
      else await api.post('/users', body);
      toast.success(t('common.saved'));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const info = apiError(err);
      if (info.messageKey === 'errors.common.duplicate') setErrors({ email: info.messageKey });
      else if (Object.keys(info.fieldErrors).length) setErrors(info.fieldErrors);
      else toast.error(t(info.messageKey));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? t('users.editTitle') : t('users.add')}</DialogTitle>
          <DialogDescription className="sr-only">{t('users.title')}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <FormField label={t('users.email')} required error={errors.email}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
          {!user && <FormField label={t('users.password')} required error={errors.password} hint={t('auth.passwordRule')}><Input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></FormField>}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-label">{t('users.roles')}</legend>
            {(assignable.data ?? []).map((r) => (
              <label key={r.code} className="flex items-center gap-2 text-body">
                <Checkbox checked={roles.includes(r.code)} onCheckedChange={(v) => setRoles((cur) => (v === true ? [...cur, r.code] : cur.filter((x) => x !== r.code)))} />
                {localName(r)}
              </label>
            ))}
            {errors.roleCodes && <p className="text-body-sm text-danger-text">{t(errors.roleCodes)}</p>}
          </fieldset>
          {can('employee.read') && (
            <FormField label={t('users.employee')} error={errors.employeeId}>
              <SelectInput value={employeeId} onChange={setEmployeeId} options={[{ value: NONE, label: t('users.noEmployee') }, ...(employees.data ?? []).map((e) => ({ value: e.id, label: `${fullName(e)} (${e.employeeCode})` }))]} />
            </FormField>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={save} loading={busy}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

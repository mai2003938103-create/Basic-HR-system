import { Camera, KeyRound, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link } from '@/lib/router';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
import { Input, Textarea } from '../../components/ui/input';
import { FormField } from '../../components/common/FormField';
import { DatePicker, SelectInput } from '../../components/common/inputs';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/layout-bits';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/useAuth';
import { useQuery } from '../../hooks/useQuery';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { api, apiError } from '../../lib/api';
import { toastError } from '../../lib/form-errors';
import { fullName } from '../../lib/format';
import type { Employee } from '../../lib/types';
import { Avatar } from '../employees/Avatar';

type Row = [string, string | null | undefined];

function Details({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="mb-8 last:mb-0">
      <h3 className="mb-4 text-section-title">{title}</h3>
      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}><dt className="text-body-sm text-ink-muted">{k}</dt><dd className="tabular rounded-sm border border-border bg-surface-sunken px-3 py-2">{v || '—'}</dd></div>
        ))}
      </dl>
    </section>
  );
}

type Personal = {
  firstName: string; lastName: string; gender: Employee['gender']; dateOfBirth: string; phone: string; address: string;
  emergencyContactName: string; emergencyContactPhone: string; emergencyContactRelation: string;
};
const personalOf = (e: Employee): Personal => ({
  firstName: e.firstName, lastName: e.lastName, gender: e.gender, dateOfBirth: e.dateOfBirth, phone: e.phone ?? '', address: e.address ?? '',
  emergencyContactName: e.emergencyContactName ?? '', emergencyContactPhone: e.emergencyContactPhone ?? '', emergencyContactRelation: e.emergencyContactRelation ?? '',
});

/** Self-service personal details, edited in place. Email (the login), job and pay stay with HR. */
function PersonalForm({ employee, onSaved }: { employee: Employee; onSaved: (e: Employee) => void }) {
  const { t } = useTranslation();
  const [initial] = useState(() => personalOf(employee));
  const [f, setF] = useState<Personal>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);
  const set = (k: keyof Personal) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    setErrors({});
    try {
      const r = await api.put<{ data: Employee }>('/employees/me', f);
      toast.success(t('common.saved'));
      onSaved(r.data.data);
    } catch (e) {
      const info = apiError(e);
      if (Object.keys(info.fieldErrors).length) setErrors(info.fieldErrors);
      else toastError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); void save(); }} noValidate>
      <h3 className="mb-1 text-section-title">{t('employees.sectionPersonal')}</h3>
      <p className="mb-4 text-body-sm text-ink-muted">{t('profile.personalHint')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('employees.firstName')} required error={errors.firstName}><Input autoComplete="given-name" value={f.firstName} onChange={set('firstName')} /></FormField>
        <FormField label={t('employees.lastName')} required error={errors.lastName}><Input autoComplete="family-name" value={f.lastName} onChange={set('lastName')} /></FormField>
        <FormField label={t('employees.gender')} required error={errors.gender}>
          <SelectInput value={f.gender} onChange={(v) => setF((x) => ({ ...x, gender: v as Personal['gender'] }))} options={(['male', 'female', 'other'] as const).map((g) => ({ value: g, label: t(`employees.${g}`) }))} />
        </FormField>
        <FormField label={t('employees.dob')} required error={errors.dateOfBirth}><DatePicker autoComplete="bday" value={f.dateOfBirth} onChange={set('dateOfBirth')} /></FormField>
        <FormField label={t('employees.phone')} required error={errors.phone}><Input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} /></FormField>
        <FormField label={t('employees.email')} hint={t('profile.emailHint')}><Input type="email" value={employee.email} readOnly disabled /></FormField>
        <FormField label={t('employees.address')} className="sm:col-span-2" error={errors.address}><Textarea rows={2} autoComplete="street-address" value={f.address} onChange={set('address')} /></FormField>
        {/* Emergency contact is not shown here (HR keeps it in the employee form); its current values are sent back unchanged. */}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        <p role="status" className="mr-auto text-body-sm text-ink-muted">{dirty ? t('common.unsavedChanges') : t('common.noChanges')}</p>
        {dirty && <Button type="button" variant="outline" onClick={() => { setF(initial); setErrors({}); }}>{t('common.cancel')}</Button>}
        <Button type="submit" loading={busy} disabled={!dirty}>{t('common.save')}</Button>
      </div>
    </form>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, reload } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Bumped after a save so the form takes the saved values as its new baseline.
  const [version, setVersion] = useState(0);
  const q = useQuery(() => api.get<{ data: Employee }>('/employees/me').then((r) => r.data.data), [user?.employee?.id], !!user?.employee);
  const e = q.data;

  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error(t('errors.upload.tooLarge'));
    const fd = new FormData();
    fd.append('photo', file);
    setUploading(true);
    try {
      const r = await api.post('/employees/me/photo', fd);
      q.setData(r.data.data);
      await reload(); // refresh the avatar in the top bar too
      toast.success(t('employees.photoUpdated'));
    } catch (err) {
      toastError(err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    setUploading(true);
    try {
      const r = await api.delete('/employees/me/photo');
      q.setData(r.data.data);
      await reload();
      toast.success(t('profile.photoRemoved'));
    } catch (err) {
      toastError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader title={t('profile.title')} actions={<Button variant="outline" asChild><Link to="/change-password"><KeyRound />{t('common.changePassword')}</Link></Button>} />
      {!user ? null : user.employee && (q.loading || !e) ? <LoadingState /> : (
        <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar employee={e ?? { firstName: user.email, lastName: '', photoUrl: null }} size="xl" />
            {e && <>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t('profile.changePhoto')} onChange={(ev) => void uploadPhoto(ev.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}><Camera />{t('profile.changePhoto')}</Button>
            {e.photoUrl && (
              <button type="button" disabled={uploading} onClick={() => void removePhoto()} className="inline-flex items-center gap-1 text-body-sm text-danger-text hover:underline disabled:opacity-60">
                <Trash2 className="size-4" aria-hidden />{t('profile.removePhoto')}
              </button>
            )}
            <p className="text-caption text-ink-muted">{t('profile.photoHint')}</p>
            </>}
            <h2 className="mt-2 text-section-title">{e ? fullName(e) : user.email}</h2>
            <p className="break-all text-body-sm text-ink-muted">{user.email}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {user.roles.map((r) => <span key={r} className="rounded-pill bg-accent-tint px-3 py-1 text-caption font-medium text-accent">{t(`roles.names.${r}`, r)}</span>)}
            </div>
            {e && <StatusBadge kind="employment" value={e.employmentStatus} />}
          </Card>
          <Card className="p-6">
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">{t('profile.tabInfo')}</TabsTrigger>
                <TabsTrigger value="security">{t('profile.tabSecurity')}</TabsTrigger>
              </TabsList>
              <TabsContent value="info">
                {e ? (
                  <PersonalForm key={version} employee={e} onSaved={(next) => { q.setData(next); setVersion((n) => n + 1); void reload(); }} />
                ) : (
                  <>
                    <Details title={t('profile.account')} rows={[[t('employees.email'), user.email]]} />
                    <p className="text-body-sm text-ink-muted">{t('profile.noEmployee')}</p>
                  </>
                )}
              </TabsContent>
              <TabsContent value="security">
                <h3 className="mb-2 text-section-title">{t('common.changePassword')}</h3>
                <p className="mb-4 text-body-sm text-ink-muted">{t('profile.securityHint')}</p>
                <Button asChild><Link to="/change-password"><KeyRound />{t('common.changePassword')}</Link></Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}
    </>
  );
}

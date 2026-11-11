import { Camera, KeyRound, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link } from '@/lib/router';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/layout-bits';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/useAuth';
import { useQuery } from '../../hooks/useQuery';
import { currencyOf, useSettings } from '../../hooks/useSettings';
import { localName } from '../../i18n';
import { api } from '../../lib/api';
import { toastError } from '../../lib/form-errors';
import { formatDate, formatMoney, fullName } from '../../lib/format';
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

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, reload } = useAuth();
  const settings = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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

  const personal: Row[] = e
    ? [
        [t('employees.firstName'), e.firstName], [t('employees.lastName'), e.lastName],
        [t('employees.gender'), t(`employees.${e.gender}`)], [t('employees.dob'), formatDate(e.dateOfBirth)],
        [t('employees.phone'), e.phone], [t('employees.email'), e.email],
        [t('employees.address'), e.address],
        [t('employees.emergencyName'), e.emergencyContactName], [t('employees.emergencyPhone'), e.emergencyContactPhone], [t('employees.emergencyRelation'), e.emergencyContactRelation],
      ]
    : [];
  const work: Row[] = e
    ? [
        [t('employees.code'), e.employeeCode], [t('employees.department'), localName(e.department)], [t('employees.position'), localName(e.position)], [t('employees.hireDate'), formatDate(e.hireDate)],
        ...(e.basicSalary !== undefined ? ([[t('employees.salary'), formatMoney(e.basicSalary, currencyOf(settings))]] as Row[]) : []),
      ]
    : [];

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
                  <>
                    <Details title={t('employees.sectionPersonal')} rows={personal} />
                    <Details title={t('employees.sectionEmployment')} rows={work} />
                  </>
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

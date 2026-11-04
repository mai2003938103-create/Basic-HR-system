import { ArrowLeft, Camera, Pencil, UserCheck, UserX } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from '@/lib/router';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ErrorState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { PermissionGate, SectionTab } from '../../components/common/layout-bits';
import { StatusBadge } from '../../components/common/StatusBadge';
import { currencyOf, useSettings } from '../../hooks/useSettings';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, apiError } from '../../lib/api';
import { toastError } from '../../lib/form-errors';
import { formatDate, formatMoney, fullName } from '../../lib/format';
import type { Employee } from '../../lib/types';
import { Avatar } from './Avatar';
import { EmployeeLeaveBalances } from './EmployeeLeaveBalances';

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-body-sm text-ink-muted">{label}</dt>
      <dd className="text-body">{children || <span className="text-ink-muted">—</span>}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="overflow-hidden pt-6">
      <SectionTab>{title}</SectionTab>
      <dl className="grid gap-4 p-6 sm:grid-cols-2">{children}</dl>
    </Card>
  );
}

export function EmployeeDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const settings = useSettings();
  const q = useQuery(() => api.get<{ data: Employee }>(`/employees/${id}`).then((r) => r.data.data), [id]);
  const [confirm, setConfirm] = useState<'inactive' | 'active' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (q.loading && !q.data) return <LoadingState />;
  if (q.error || !q.data) return <ErrorState onRetry={q.reload} message={apiError(q.error).messageKey} />;
  const e = q.data;
  const inactive = e.employmentStatus === 'inactive' || e.employmentStatus === 'terminated';

  const setStatus = async (status: string) => {
    try {
      const r = await api.patch(`/employees/${e.id}/status`, { status });
      q.setData(r.data.data);
      toast.success(t('common.saved'));
    } catch (err) {
      toastError(err);
    }
  };

  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error(t('errors.upload.tooLarge'));
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const r = await api.post(`/employees/${e.id}/photo`, fd);
      q.setData(r.data.data);
      toast.success(t('employees.photoUpdated'));
    } catch (err) {
      toastError(err);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <Link to="/employees" className="mb-3 inline-flex items-center gap-1 text-body-sm text-primary-hover hover:underline">
        <ArrowLeft className="size-4" />{t('employees.title')}
      </Link>
      <Card className="mb-6 flex flex-wrap items-center gap-4 p-6">
        <div className="relative">
          <Avatar employee={e} size="lg" />
          <PermissionGate permission="employee.update">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t('employees.uploadPhoto')} onChange={(ev) => void uploadPhoto(ev.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} aria-label={t('employees.uploadPhoto')} className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-pill border border-border bg-surface-card text-primary-hover shadow-card hover:bg-surface-sunken">
              <Camera className="size-4" />
            </button>
          </PermissionGate>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-page-title">{fullName(e)}</h1>
          <p className="text-body-sm text-ink-muted">{e.employeeCode} · {localName(e.position)} · {localName(e.department)}</p>
          <div className="mt-2"><StatusBadge kind="employment" value={e.employmentStatus} /></div>
        </div>
        <PermissionGate permission="employee.update">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link to={`/employees/${e.id}/edit`}><Pencil />{t('common.edit')}</Link></Button>
            {inactive ? (
              <Button variant="outline" onClick={() => setConfirm('active')}><UserCheck />{t('employees.activate')}</Button>
            ) : (
              <Button variant="outline" className="hover:text-danger-text" onClick={() => setConfirm('inactive')}><UserX />{t('employees.deactivate')}</Button>
            )}
          </div>
        </PermissionGate>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Block title={t('employees.sectionPersonal')}>
          <Info label={t('employees.gender')}>{t(`employees.${e.gender}`)}</Info>
          <Info label={t('employees.dob')}>{formatDate(e.dateOfBirth)}</Info>
          <Info label={t('employees.phone')}>{e.phone}</Info>
          <Info label={t('employees.email')}>{e.email}</Info>
          <div className="sm:col-span-2"><Info label={t('employees.address')}>{e.address}</Info></div>
        </Block>
        <Block title={t('employees.sectionEmployment')}>
          <Info label={t('employees.department')}>{localName(e.department)}</Info>
          <Info label={t('employees.position')}>{localName(e.position)}</Info>
          <Info label={t('employees.hireDate')}>{formatDate(e.hireDate)}</Info>
          {e.basicSalary !== undefined && <Info label={t('employees.salary')}><span className="tabular">{formatMoney(e.basicSalary, currencyOf(settings))}</span></Info>}
        </Block>
        <Block title={t('employees.sectionEmergency')}>
          <Info label={t('employees.emergencyName')}>{e.emergencyContactName}</Info>
          <Info label={t('employees.emergencyPhone')}>{e.emergencyContactPhone}</Info>
          <Info label={t('employees.emergencyRelation')}>{e.emergencyContactRelation}</Info>
        </Block>
        <Block title={t('employees.sectionAccount')}>
          {e.user ? (
            <>
              <Info label={t('users.email')}>{e.user.email}</Info>
              <Info label={t('users.roles')}>{e.user.roles.map((r) => t(`roles.names.${r}`, { defaultValue: r })).join(', ')}</Info>
              <Info label={t('common.status')}><StatusBadge kind="account" value={e.user.isActive ? 'active' : 'inactive'} /></Info>
            </>
          ) : (
            <p className="text-body-sm text-ink-muted sm:col-span-2">{t('employees.noAccount')}</p>
          )}
        </Block>
        <PermissionGate permission="leave.manage">
          <EmployeeLeaveBalances employeeId={e.id} />
        </PermissionGate>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm === 'inactive' ? t('employees.confirmDeactivate') : t('employees.activate')}
        description={confirm === 'inactive' ? t('employees.confirmDeactivateText') : undefined}
        confirmLabel={confirm === 'inactive' ? t('employees.deactivate') : t('employees.activate')}
        tone={confirm === 'inactive' ? 'danger' : 'primary'}
        onConfirm={() => setStatus(confirm!)}
      />
    </>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Input, Textarea } from '../../components/ui/input';
import { FormField } from '../../components/common/FormField';
import { DatePicker, SelectInput } from '../../components/common/inputs';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader, SectionTab } from '../../components/common/layout-bits';
import { useAuth } from '../../auth/useAuth';
import { useDepartments } from '../../hooks/useDepartments';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, type Page } from '../../lib/api';
import { applyServerErrors } from '../../lib/form-errors';
import { employeeFormSchema, type EmployeeForm } from '../../lib/schemas/employee';
import type { Employee, Position } from '../../lib/types';

const EMPTY: EmployeeForm = {
  employeeCode: '', firstName: '', lastName: '', gender: 'male', dateOfBirth: '', phone: '', email: '', address: '', departmentId: '', positionId: '',
  hireDate: '', employmentStatus: 'active', basicSalary: 0, emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
  createAccount: false, accountPassword: '', accountRole: 'employee',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden pt-6">
      <SectionTab>{title}</SectionTab>
      <div className="grid gap-4 p-6 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function EmployeeFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const { t } = useTranslation();
  const { can } = useAuth();
  const navigate = useNavigate();
  const depts = useDepartments();
  const existing = useQuery(() => api.get<{ data: Employee }>(`/employees/${id}`).then((r) => r.data.data), [id], editing);
  const form = useForm<EmployeeForm>({ resolver: zodResolver(employeeFormSchema), defaultValues: EMPTY });
  const { register, handleSubmit, formState, control, watch, setValue, reset, setError } = form;
  const departmentId = watch('departmentId');
  const createAccount = watch('createAccount');

  const positions = useQuery(
    () => api.get<Page<Position>>('/positions', { params: { departmentId, pageSize: 100, isActive: 'true' } }).then((r) => r.data.data),
    [departmentId],
    !!departmentId,
  );

  useEffect(() => {
    const e = existing.data;
    if (!e) return;
    reset({
      ...EMPTY,
      employeeCode: e.employeeCode, firstName: e.firstName, lastName: e.lastName, gender: e.gender, dateOfBirth: e.dateOfBirth, phone: e.phone, email: e.email,
      address: e.address ?? '', departmentId: e.departmentId, positionId: e.positionId, hireDate: e.hireDate,
      employmentStatus: e.employmentStatus === 'probation' ? 'probation' : 'active', basicSalary: Number(e.basicSalary ?? 0),
      emergencyContactName: e.emergencyContactName ?? '', emergencyContactPhone: e.emergencyContactPhone ?? '', emergencyContactRelation: e.emergencyContactRelation ?? '',
    });
  }, [existing.data, reset]);

  // A position from another department is cleared as soon as the department changes.
  useEffect(() => {
    const pos = form.getValues('positionId');
    if (pos && positions.data && !positions.data.some((p) => p.id === pos)) setValue('positionId', '');
  }, [positions.data, form, setValue]);

  const onSubmit = handleSubmit(async (v) => {
    const { createAccount: withAccount, accountPassword, accountRole, ...fields } = v;
    const body = {
      ...fields,
      address: fields.address || null,
      emergencyContactName: fields.emergencyContactName || null,
      emergencyContactPhone: fields.emergencyContactPhone || null,
      emergencyContactRelation: fields.emergencyContactRelation || null,
      ...(!editing && withAccount ? { account: { email: fields.email, password: accountPassword, roleCodes: [accountRole] } } : {}),
    };
    try {
      const r = editing ? await api.put(`/employees/${id}`, body) : await api.post('/employees', body);
      toast.success(t(editing ? 'employees.updated' : 'employees.created'));
      navigate(`/employees/${r.data.data.id}`);
    } catch (e) {
      applyServerErrors(e, setError, 'employeeCode');
    }
  });

  if (editing && existing.loading) return <LoadingState />;
  const err = (k: keyof EmployeeForm) => formState.errors[k]?.message as string | undefined;
  const roleOptions = ['employee', 'manager', 'hr_admin'].map((r) => ({ value: r, label: t(`roles.names.${r}`) }));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <Link to={editing ? `/employees/${id}` : '/employees'} className="mb-3 inline-flex items-center gap-1 text-body-sm text-primary-hover hover:underline">
          <ArrowLeft className="size-4" />{t('common.back')}
        </Link>
        <PageHeader title={editing ? t('employees.editTitle') : t('employees.add')} />
      </div>
      <Section title={t('employees.sectionPersonal')}>
        <FormField label={t('employees.code')} required error={err('employeeCode')}><Input {...register('employeeCode')} maxLength={30} /></FormField>
        <FormField label={t('employees.gender')} required error={err('gender')}>
          <Controller control={control} name="gender" render={({ field }) => <SelectInput value={field.value} onChange={field.onChange} options={['male', 'female', 'other'].map((g) => ({ value: g, label: t(`employees.${g}`) }))} />} />
        </FormField>
        <FormField label={t('employees.firstName')} required error={err('firstName')}><Input {...register('firstName')} /></FormField>
        <FormField label={t('employees.lastName')} required error={err('lastName')}><Input {...register('lastName')} /></FormField>
        <FormField label={t('employees.dob')} required error={err('dateOfBirth')}><DatePicker {...register('dateOfBirth')} /></FormField>
        <FormField label={t('employees.phone')} required error={err('phone')}><Input type="tel" {...register('phone')} /></FormField>
        <FormField label={t('employees.email')} required error={err('email')}><Input type="email" {...register('email')} /></FormField>
        <FormField label={t('employees.address')} className="sm:col-span-2"><Textarea {...register('address')} /></FormField>
      </Section>
      <Section title={t('employees.sectionEmployment')}>
        <FormField label={t('employees.department')} required error={err('departmentId')}>
          <Controller control={control} name="departmentId" render={({ field }) => <SelectInput value={field.value} onChange={field.onChange} options={(depts.data ?? []).filter((d) => d.isActive).map((d) => ({ value: d.id, label: localName(d) }))} />} />
        </FormField>
        <FormField label={t('employees.position')} required error={err('positionId')}>
          <Controller
            control={control}
            name="positionId"
            render={({ field }) => (
              <SelectInput value={field.value} onChange={field.onChange} disabled={!departmentId} placeholder={departmentId ? undefined : t('employees.choosePosition')} options={(positions.data ?? []).map((p) => ({ value: p.id, label: localName(p) }))} />
            )}
          />
        </FormField>
        <FormField label={t('employees.hireDate')} required error={err('hireDate')}><DatePicker {...register('hireDate')} /></FormField>
        <FormField label={t('employees.status')} error={err('employmentStatus')}>
          <Controller control={control} name="employmentStatus" render={({ field }) => <SelectInput value={field.value} onChange={field.onChange} options={['active', 'probation'].map((s) => ({ value: s, label: t(`status.employment.${s}`) }))} />} />
        </FormField>
        {(can('employee.update') || !editing) && (
          <FormField label={t('employees.salary')} error={err('basicSalary')}><Input type="number" min={0} step={1000} inputMode="numeric" {...register('basicSalary')} /></FormField>
        )}
      </Section>
      <Section title={t('employees.sectionEmergency')}>
        <FormField label={t('employees.emergencyName')}><Input {...register('emergencyContactName')} /></FormField>
        <FormField label={t('employees.emergencyPhone')} error={err('emergencyContactPhone')}><Input type="tel" {...register('emergencyContactPhone')} /></FormField>
        <FormField label={t('employees.emergencyRelation')}><Input {...register('emergencyContactRelation')} /></FormField>
      </Section>
      {!editing && (
        <Section title={t('employees.sectionAccount')}>
          <Controller control={control} name="createAccount" render={({ field }) => (
            <label className="flex items-center gap-3 text-label sm:col-span-2">
              <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              {t('employees.createAccount')}
            </label>
          )} />
          {createAccount && (
            <>
              <FormField label={t('employees.accountPassword')} required error={err('accountPassword')} hint={t('employees.accountHint')}>
                <Input type="text" autoComplete="new-password" {...register('accountPassword')} />
              </FormField>
              <FormField label={t('employees.roles')} required error={err('accountRole')}>
                <Controller control={control} name="accountRole" render={({ field }) => <SelectInput value={field.value} onChange={field.onChange} options={roleOptions} />} />
              </FormField>
            </>
          )}
        </Section>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        <Button type="submit" loading={formState.isSubmitting}>{t('common.save')}</Button>
      </div>
    </form>
  );
}

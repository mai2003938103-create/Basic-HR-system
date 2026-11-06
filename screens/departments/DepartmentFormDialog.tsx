import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input, Textarea } from '../../components/ui/input';
import { Switch } from '../../components/ui/checkbox';
import { FormField } from '../../components/common/FormField';
import { SelectInput } from '../../components/common/inputs';
import { api, type Page } from '../../lib/api';
import { applyServerErrors } from '../../lib/form-errors';
import { fullName } from '../../lib/format';
import { useQuery } from '../../hooks/useQuery';
import type { Department, Employee } from '../../lib/types';

const req = z.string().trim().min(1, 'errors.validation.required');
const schema = z.object({
  code: req.max(30).regex(/^[A-Za-z0-9_-]+$/, 'errors.validation.code'),
  nameLo: req.max(200),
  nameEn: req.max(200),
  description: z.string().max(1000).optional(),
  managerId: z.string().optional(),
  isActive: z.boolean(),
});
type Form = z.infer<typeof schema>;
const NONE = '__none__';

export function DepartmentFormDialog({ open, onOpenChange, department, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; department?: Department | null; onSaved: () => void }) {
  const { t } = useTranslation();
  const form = useForm<Form>({ resolver: zodResolver(schema) });
  const { register, handleSubmit, formState, reset, control, setError } = form;

  useEffect(() => {
    if (open) reset({ code: department?.code ?? '', nameLo: department?.nameLo ?? '', nameEn: department?.nameEn ?? '', description: department?.description ?? '', managerId: department?.manager?.id ?? NONE, isActive: department?.isActive ?? true });
  }, [open, department, reset]);

  // Managers are chosen among active employees of this department (only when editing).
  const staff = useQuery(
    () => api.get<Page<Employee>>('/employees', { params: { departmentId: department!.id, pageSize: 100, sort: 'firstName:asc' } }).then((r) => r.data.data.filter((e) => e.employmentStatus === 'active' || e.employmentStatus === 'probation')),
    [department?.id, open],
    open && !!department,
  );

  const onSubmit = handleSubmit(async (v) => {
    const body = { ...v, managerId: v.managerId && v.managerId !== NONE ? v.managerId : null, description: v.description || null };
    try {
      if (department) await api.put(`/departments/${department.id}`, body);
      else await api.post('/departments', body);
      toast.success(t('common.saved'));
      onOpenChange(false);
      onSaved();
    } catch (e) {
      applyServerErrors(e, setError, 'code');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>{department ? t('departments.editTitle') : t('departments.add')}</DialogTitle>
            <DialogDescription className="sr-only">{t('departments.title')}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <FormField label={t('departments.code')} required error={formState.errors.code?.message}>
              <Input {...register('code')} maxLength={30} />
            </FormField>
            <FormField label={t('departments.nameLo')} required error={formState.errors.nameLo?.message}>
              <Input {...register('nameLo')} />
            </FormField>
            <FormField label={t('departments.nameEn')} required error={formState.errors.nameEn?.message}>
              <Input {...register('nameEn')} />
            </FormField>
            <FormField label={t('departments.description')} error={formState.errors.description?.message}>
              <Textarea {...register('description')} />
            </FormField>
            {department && (
              <FormField label={t('departments.manager')} error={formState.errors.managerId?.message}>
                <Controller
                  control={control}
                  name="managerId"
                  render={({ field }) => (
                    <SelectInput value={field.value} onChange={field.onChange} options={[{ value: NONE, label: t('departments.noManager') }, ...(staff.data ?? []).map((e) => ({ value: e.id, label: `${fullName(e)} (${e.employeeCode})` }))]} />
                  )}
                />
              </FormField>
            )}
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <label className="flex items-center gap-3 text-label">
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                  {t('common.active')}
                </label>
              )}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={formState.isSubmitting}>{t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { localName } from '../../i18n';
import { api } from '../../lib/api';
import { applyServerErrors } from '../../lib/form-errors';
import type { Department, Position } from '../../lib/types';

const req = z.string().trim().min(1, 'errors.validation.required');
const schema = z.object({
  code: req.max(30).regex(/^[A-Za-z0-9_-]+$/, 'errors.validation.code'),
  nameLo: req.max(200),
  nameEn: req.max(200),
  departmentId: z.string({ required_error: 'errors.position.invalidDepartment' }).min(1, 'errors.position.invalidDepartment'),
  description: z.string().max(1000).optional(),
  isActive: z.boolean(),
});
type Form = z.infer<typeof schema>;

export function PositionFormDialog({ open, onOpenChange, position, departments, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; position?: Position | null; departments: Department[]; onSaved: () => void }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState, reset, control, setError } = useForm<Form>({ resolver: zodResolver(schema) });
  useEffect(() => {
    if (open) reset({ code: position?.code ?? '', nameLo: position?.nameLo ?? '', nameEn: position?.nameEn ?? '', departmentId: position?.department.id ?? '', description: position?.description ?? '', isActive: position?.isActive ?? true });
  }, [open, position, reset]);

  const onSubmit = handleSubmit(async (v) => {
    const body = { ...v, description: v.description || null };
    try {
      if (position) await api.put(`/positions/${position.id}`, body);
      else await api.post('/positions', body);
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
            <DialogTitle>{position ? t('positions.editTitle') : t('positions.add')}</DialogTitle>
            <DialogDescription className="sr-only">{t('positions.title')}</DialogDescription>
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
            <FormField label={t('employees.department')} required error={formState.errors.departmentId?.message}>
              <Controller control={control} name="departmentId" render={({ field }) => <SelectInput value={field.value} onChange={field.onChange} options={departments.map((d) => ({ value: d.id, label: localName(d) }))} />} />
            </FormField>
            <FormField label={t('departments.description')}>
              <Textarea {...register('description')} />
            </FormField>
            <Controller control={control} name="isActive" render={({ field }) => (
              <label className="flex items-center gap-3 text-label"><Switch checked={field.value} onCheckedChange={field.onChange} />{t('common.active')}</label>
            )} />
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

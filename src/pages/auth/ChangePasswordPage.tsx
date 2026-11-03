import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormField } from '../../components/common/FormField';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../auth/useAuth';
import { api, apiError } from '../../lib/api';
import { homePath } from '../../lib/permissions';
import { newPasswordSchema } from './passwordSchema';

const schema = z
  .object({ currentPassword: z.string().min(1, 'errors.validation.required'), newPassword: newPasswordSchema, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'auth.passwordMismatch' });

export function ChangePasswordPage() {
  const { t } = useTranslation();
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState, setError } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await api.put('/auth/password', { currentPassword: v.currentPassword, newPassword: v.newPassword });
      toast.success(t('auth.passwordChanged'));
      // All sessions were revoked: sign in again with the new password.
      await logout();
      navigate('/login', { replace: true });
    } catch (e) {
      const err = apiError(e);
      if (err.fieldErrors.currentPassword) setError('currentPassword', { message: err.fieldErrors.currentPassword });
      else if (err.fieldErrors.newPassword) setError('newPassword', { message: err.fieldErrors.newPassword });
      else toast.error(t(err.messageKey));
    }
  });

  return (
    <div className="mx-auto w-full max-w-md py-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <h1 className="text-section-title">{t('auth.changeTitle')}</h1>
          {user?.mustChangePassword && <p className="rounded-sm bg-warning-tint px-3 py-2 text-body-sm text-warning-text">{t('auth.mustChange')}</p>}
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <FormField label={t('auth.currentPassword')} error={formState.errors.currentPassword?.message}>
              <Input type="password" autoComplete="current-password" {...register('currentPassword')} />
            </FormField>
            <FormField label={t('auth.newPassword')} error={formState.errors.newPassword?.message} hint={t('auth.passwordRule')}>
              <Input type="password" autoComplete="new-password" {...register('newPassword')} />
            </FormField>
            <FormField label={t('auth.confirmPassword')} error={formState.errors.confirm?.message}>
              <Input type="password" autoComplete="new-password" {...register('confirm')} />
            </FormField>
            <div className="flex justify-end gap-2">
              {!user?.mustChangePassword && (
                <Button type="button" variant="outline" onClick={() => navigate(homePath(can))}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button type="submit" loading={formState.isSubmitting}>{t('common.save')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

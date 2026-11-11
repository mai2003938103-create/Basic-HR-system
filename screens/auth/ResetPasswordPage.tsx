import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from '@/lib/router';
import { z } from 'zod';
import { AuthLayout } from '../../layouts/AuthLayout';
import { FormField } from '../../components/common/FormField';
import { Button } from '../../components/ui/button';
import { PasswordInput } from '../../components/ui/password-input';
import { api, apiError } from '../../lib/api';
import { newPasswordSchema } from './passwordSchema';

const schema = z.object({ newPassword: newPasswordSchema, confirm: z.string() }).refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'auth.passwordMismatch' });

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'form' | 'done' | 'invalid'>(token ? 'form' : 'invalid');
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await api.post('/auth/reset-password', { token, newPassword: v.newPassword });
      setState('done');
    } catch (e) {
      if (apiError(e).messageKey === 'errors.auth.invalidToken') setState('invalid');
    }
  });

  return (
    <AuthLayout>
      <div className="flex flex-col gap-4">
        <h2 className="text-section-title">{t('auth.resetTitle')}</h2>
        {state === 'form' && (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <FormField label={t('auth.newPassword')} error={formState.errors.newPassword?.message} hint={t('auth.passwordRule')}>
              <PasswordInput autoComplete="new-password" {...register('newPassword')} />
            </FormField>
            <FormField label={t('auth.confirmPassword')} error={formState.errors.confirm?.message}>
              <PasswordInput autoComplete="new-password" {...register('confirm')} />
            </FormField>
            <Button type="submit" className="w-full" loading={formState.isSubmitting}>{t('common.save')}</Button>
          </form>
        )}
        {state !== 'form' && (
          <p role="status" className={state === 'done' ? 'rounded-sm bg-success-tint px-3 py-2 text-success-text' : 'rounded-sm bg-danger-tint px-3 py-2 text-danger-text'}>
            {t(state === 'done' ? 'auth.resetDone' : 'auth.resetMissing')}
          </p>
        )}
        <Link to="/login" className="text-center text-body-sm text-primary-hover underline-offset-4 hover:underline">{t('auth.backToLogin')}</Link>
      </div>
    </AuthLayout>
  );
}

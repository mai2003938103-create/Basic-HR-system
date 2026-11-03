import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthLayout } from '../../layouts/AuthLayout';
import { FormField } from '../../components/common/FormField';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../auth/useAuth';
import { apiError } from '../../lib/api';
import { homePath } from '../../lib/permissions';

const schema = z.object({
  email: z.string().trim().min(1, 'errors.validation.required').email('errors.validation.email'),
  password: z.string().min(1, 'errors.validation.required'),
});

export function LoginPage() {
  const { t } = useTranslation();
  const { login, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  if (status === 'authenticated' && user) return <Navigate to={homePath((p) => user.permissions.includes(p))} replace />;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const me = await login(v.email, v.password);
      const from = (location.state as { from?: string } | null)?.from;
      const can = (p: string) => me.permissions.includes(p);
      navigate(me.mustChangePassword ? '/change-password' : from && from !== '/login' ? from : homePath(can), { replace: true });
    } catch (e) {
      setError(apiError(e).messageKey);
    }
  });

  return (
    <AuthLayout>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <h2 className="text-section-title">{t('auth.title')}</h2>
        {error && (
          <div role="alert" className="rounded-sm bg-danger-tint px-3 py-2 text-body-sm text-danger-text">
            {t(error)}
          </div>
        )}
        <FormField label={t('auth.email')} error={formState.errors.email?.message}>
          <Input type="email" autoComplete="username" placeholder="name@company.la" {...register('email')} />
        </FormField>
        <FormField label={t('auth.password')} error={formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register('password')} />
        </FormField>
        <Button type="submit" className="h-11 w-full" loading={formState.isSubmitting}>
          {formState.isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
        <p className="text-center text-body-sm text-ink-muted">{t('auth.forgot')}</p>
      </form>
    </AuthLayout>
  );
}

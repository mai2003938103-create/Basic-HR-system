import { KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader, SectionTab } from '../../components/common/layout-bits';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/useAuth';
import { useQuery } from '../../hooks/useQuery';
import { currencyOf, useSettings } from '../../hooks/useSettings';
import { localName } from '../../i18n';
import { api } from '../../lib/api';
import { formatDate, formatMoney, fullName } from '../../lib/format';
import type { Employee } from '../../lib/types';
import { Avatar } from '../employees/Avatar';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const settings = useSettings();
  const q = useQuery(() => api.get<{ data: Employee }>('/employees/me').then((r) => r.data.data), [user?.employee?.id], !!user?.employee);
  const e = q.data;
  const rows: [string, string | undefined][] = e
    ? [
        [t('employees.code'), e.employeeCode], [t('employees.email'), e.email], [t('employees.phone'), e.phone], [t('employees.dob'), formatDate(e.dateOfBirth)],
        [t('employees.department'), localName(e.department)], [t('employees.position'), localName(e.position)], [t('employees.hireDate'), formatDate(e.hireDate)],
        ...(e.basicSalary !== undefined ? ([[t('employees.salary'), formatMoney(e.basicSalary, currencyOf(settings))]] as [string, string][]) : []),
      ]
    : [];

  return (
    <>
      <PageHeader title={t('profile.title')} actions={<Button variant="outline" asChild><Link to="/change-password"><KeyRound />{t('common.changePassword')}</Link></Button>} />
      {!user?.employee ? (
        <Card className="p-6"><p className="text-body">{user?.email}</p><p className="text-body-sm text-ink-muted">{t('profile.noEmployee')}</p></Card>
      ) : q.loading || !e ? <LoadingState /> : (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 p-6">
            <Avatar employee={e} size="lg" />
            <div>
              <h2 className="text-section-title">{fullName(e)}</h2>
              <p className="text-body-sm text-ink-muted">{user.email}</p>
              <div className="mt-1"><StatusBadge kind="employment" value={e.employmentStatus} /></div>
            </div>
          </div>
          <SectionTab>{t('employees.sectionEmployment')}</SectionTab>
          <dl className="grid gap-4 p-6 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k}><dt className="text-body-sm text-ink-muted">{k}</dt><dd className="tabular">{v || '—'}</dd></div>
            ))}
          </dl>
        </Card>
      )}
    </>
  );
}

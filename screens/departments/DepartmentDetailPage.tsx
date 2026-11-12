import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from '@/lib/router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState, ErrorState } from '../../components/common/EmptyState';
import { PageHeader, PermissionGate, SectionTab, BackLink } from '../../components/common/layout-bits';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, apiError, type Page } from '../../lib/api';
import { fullName } from '../../lib/format';
import type { Department, Employee, Position } from '../../lib/types';
import { DepartmentFormDialog } from './DepartmentFormDialog';

export function DepartmentDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [edit, setEdit] = useState(false);
  const dept = useQuery(() => api.get<{ data: Department }>(`/departments/${id}`).then((r) => r.data.data), [id]);
  const staff = useQuery(() => api.get<Page<Employee>>('/employees', { params: { departmentId: id, pageSize: 100, sort: 'firstName:asc' } }).then((r) => r.data.data), [id]);
  const positions = useQuery(() => api.get<Page<Position>>('/positions', { params: { departmentId: id, pageSize: 100 } }).then((r) => r.data.data), [id]);

  if (dept.loading) return <LoadingState />;
  if (dept.error || !dept.data) return <ErrorState onRetry={dept.reload} message={apiError(dept.error).messageKey} />;
  const d = dept.data;

  return (
    <>
      <BackLink to="/departments">{t('departments.title')}</BackLink>
      <PageHeader
        showTitle
        title={localName(d)}
        subtitle={`${d.code} · ${d.manager ? `${t('departments.manager')}: ${fullName(d.manager)}` : t('departments.noManager')}`}
        actions={<PermissionGate permission="department.manage"><Button variant="outline" onClick={() => setEdit(true)}><Pencil />{t('common.edit')}</Button></PermissionGate>}
      />
      {d.description && <p className="mb-6 max-w-3xl text-body text-ink-muted">{d.description}</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden pt-6">
          <SectionTab>{t('departments.employees')}</SectionTab>
          {staff.loading ? <LoadingState rows={3} /> : (staff.data ?? []).length === 0 ? <EmptyState title={t('employees.emptyTitle')} /> : (
            <ul className="mt-4 divide-y divide-border">
              {staff.data!.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3">
                  <div>
                    <Link to={`/employees/${e.id}`} className="font-medium hover:text-primary-hover hover:underline">{fullName(e)}</Link>
                    <p className="text-body-sm text-ink-muted">{e.employeeCode} · {localName(e.position)}</p>
                  </div>
                  <StatusBadge kind="employment" value={e.employmentStatus} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="overflow-hidden pt-6">
          <SectionTab>{t('departments.positions')}</SectionTab>
          {(positions.data ?? []).length === 0 ? <EmptyState title={t('positions.emptyTitle')} /> : (
            <ul className="mt-4 divide-y divide-border">
              {positions.data!.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-6 py-3">
                  <span>{localName(p)}</span>
                  <span className="tabular text-body-sm text-ink-muted">{p.employeeCount}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <DepartmentFormDialog open={edit} onOpenChange={setEdit} department={d} onSaved={() => { void dept.reload(); void staff.reload(); }} />
    </>
  );
}

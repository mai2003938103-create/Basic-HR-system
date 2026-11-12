import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@/lib/router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable, type Column } from '../../components/common/DataTable';
import { FilterBar } from '../../components/common/FilterBar';
import { FilterDropdown, SearchBar } from '../../components/common/inputs';
import { PageHeader, PermissionGate } from '../../components/common/layout-bits';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useDepartments } from '../../hooks/useDepartments';
import { cleanParams, useListQuery } from '../../hooks/useListQuery';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, type Page } from '../../lib/api';
import { formatDate, fullName } from '../../lib/format';
import type { Employee } from '../../lib/types';
import { Avatar } from './Avatar';

export function EmployeesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lq = useListQuery({ sort: 'employeeCode:asc', filters: ['departmentId', 'status'] });
  const q = useQuery(() => api.get<Page<Employee>>('/employees', { params: cleanParams(lq.params) }).then((r) => r.data), [lq.params]);
  const depts = useDepartments();

  const columns: Column<Employee>[] = [
    { key: 'employeeCode', header: t('employees.code'), sortable: true, cell: (e) => <span className="font-medium">{e.employeeCode}</span> },
    {
      key: 'firstName', header: t('employees.fullName'), sortable: true,
      cell: (e) => (
        <span className="flex items-center gap-3">
          <Avatar employee={e} size="sm" />
          <span><Link to={`/employees/${e.id}`} onClick={(ev) => ev.stopPropagation()} className="block font-medium text-primary-hover hover:underline">{fullName(e)}</Link><span className="block text-body-sm text-ink-muted">{e.email}</span></span>
        </span>
      ),
    },
    { key: 'department', header: t('employees.department'), cell: (e) => localName(e.department) },
    { key: 'position', header: t('employees.position'), cell: (e) => localName(e.position) },
    { key: 'hireDate', header: t('employees.hireDate'), sortable: true, cell: (e) => <span className="tabular">{formatDate(e.hireDate)}</span> },
    { key: 'status', header: t('employees.status'), cell: (e) => <StatusBadge kind="employment" value={e.employmentStatus} /> },
  ];

  return (
    <>
      <PageHeader title={t('employees.title')} actions={<PermissionGate permission="employee.create"><Button asChild><Link to="/employees/new"><Plus />{t('employees.add')}</Link></Button></PermissionGate>} />
      <Card>
        <div className="flex flex-col gap-3 p-4 md:flex-row md:flex-wrap md:items-end">
          <SearchBar value={lq.searchInput} onChange={lq.setSearch} placeholder={t('employees.searchPlaceholder')} className="sm:w-80" />
          <FilterBar className="p-0" activeCount={['departmentId', 'status'].filter((k) => lq.params[k]).length}>
          <FilterDropdown label={t('employees.department')} value={lq.params.departmentId as string | undefined} onChange={(v) => lq.setFilter('departmentId', v)} allLabel={t('employees.allDepartments')} options={(depts.data ?? []).map((d) => ({ value: d.id, label: localName(d) }))} />
          <FilterDropdown label={t('employees.status')} value={lq.params.status as string | undefined} onChange={(v) => lq.setFilter('status', v)} allLabel={t('employees.allStatuses')} options={['active', 'probation', 'inactive', 'terminated'].map((s) => ({ value: s, label: t(`status.employment.${s}`) }))} />
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={q.data?.data ?? []}
          total={q.data?.meta.total ?? 0}
          params={lq.params}
          loading={q.loading}
          error={q.error}
          onRetry={q.reload}
          onSortChange={lq.setSort}
          onPageChange={lq.setPage}
          onRowClick={(e) => navigate(`/employees/${e.id}`)}
          emptyTitle={lq.params.search || lq.params.departmentId || lq.params.status ? t('common.emptyFiltered') : t('employees.emptyTitle')}
          mobileCard={(e) => (
            <Link to={`/employees/${e.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-sunken">
              <Avatar employee={e} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{fullName(e)}</span>
                <span className="block truncate text-body-sm text-ink-muted">{e.employeeCode} · {localName(e.position)}</span>
              </span>
              <StatusBadge kind="employment" value={e.employmentStatus} />
            </Link>
          )}
        />
      </Card>
    </>
  );
}

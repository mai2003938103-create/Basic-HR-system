import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@/lib/router';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FilterDropdown, SearchBar } from '../../components/common/inputs';
import { PageHeader, PermissionGate } from '../../components/common/layout-bits';
import { RowActions } from '../../components/common/RowActions';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/useAuth';
import { cleanParams, useListQuery } from '../../hooks/useListQuery';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, type Page } from '../../lib/api';
import { toastError } from '../../lib/form-errors';
import { fullName } from '../../lib/format';
import type { Department } from '../../lib/types';
import { DepartmentFormDialog } from './DepartmentFormDialog';

export function DepartmentsPage() {
  const { t, i18n } = useTranslation();
  const { can } = useAuth();
  const navigate = useNavigate();
  const lq = useListQuery({ sort: 'code:asc', filters: ['isActive'] });
  const q = useQuery(() => api.get<Page<Department>>('/departments', { params: cleanParams(lq.params) }).then((r) => r.data), [lq.params]);
  const [editing, setEditing] = useState<Department | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const manage = can('department.manage');

  const columns: Column<Department>[] = [
    { key: 'code', header: t('departments.code'), sortable: true, cell: (d) => <span className="font-medium">{d.code}</span> },
    { key: i18n.language === 'lo' ? 'nameLo' : 'nameEn', header: t('departments.name'), sortable: true, cell: (d) => <Link to={`/departments/${d.id}`} onClick={(ev) => ev.stopPropagation()} className="font-medium text-primary-hover hover:underline">{localName(d)}</Link> },
    { key: 'manager', header: t('departments.manager'), cell: (d) => (d.manager ? fullName(d.manager) : <span className="text-ink-muted">{t('departments.noManager')}</span>) },
    { key: 'employeeCount', header: t('departments.employeeCount'), align: 'right', cell: (d) => d.employeeCount },
    { key: 'isActive', header: t('common.status'), cell: (d) => <StatusBadge kind="account" value={d.isActive ? 'active' : 'inactive'} /> },
    ...(manage ? [{ key: 'actions', header: '', cell: (d: Department) => <RowActions name={localName(d)} onEdit={() => setEditing(d)} onDelete={() => setDeleting(d)} /> }] : []),
  ];

  return (
    <>
      <PageHeader
        title={t('departments.title')}
        actions={
          <PermissionGate permission="department.manage">
            <Button onClick={() => setEditing(null)}><Plus />{t('departments.add')}</Button>
          </PermissionGate>
        }
      />
      <Card>
        <div className="flex flex-wrap gap-3 p-4">
          <SearchBar value={lq.searchInput} onChange={lq.setSearch} />
          <FilterDropdown
            label={t('common.status')}
            value={lq.params.isActive as string | undefined}
            onChange={(v) => lq.setFilter('isActive', v)}
            allLabel={t('common.all')}
            options={[{ value: 'true', label: t('common.active') }, { value: 'false', label: t('common.inactive') }]}
          />
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
          onRowClick={(d) => navigate(`/departments/${d.id}`)}
          emptyTitle={lq.params.search ? t('common.emptyFiltered') : t('departments.emptyTitle')}
        />
      </Card>
      <DepartmentFormDialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} department={editing} onSaved={q.reload} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('departments.confirmDelete', { name: deleting ? localName(deleting) : '' })}
        description={t('common.cannotUndo')}
        confirmLabel={t('common.delete')}
        tone="danger"
        onConfirm={async () => {
          try {
            await api.delete(`/departments/${deleting!.id}`);
            toast.success(t('common.deleted'));
            void q.reload();
          } catch (e) {
            toastError(e);
          }
        }}
      />
    </>
  );
}

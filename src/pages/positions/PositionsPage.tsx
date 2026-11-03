import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useDepartments } from '../../hooks/useDepartments';
import { cleanParams, useListQuery } from '../../hooks/useListQuery';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, type Page } from '../../lib/api';
import { toastError } from '../../lib/form-errors';
import type { Position } from '../../lib/types';
import { PositionFormDialog } from './PositionFormDialog';

export function PositionsPage() {
  const { t, i18n } = useTranslation();
  const { can } = useAuth();
  const lq = useListQuery({ sort: 'code:asc', filters: ['departmentId', 'isActive'] });
  const q = useQuery(() => api.get<Page<Position>>('/positions', { params: cleanParams(lq.params) }).then((r) => r.data), [lq.params]);
  const depts = useDepartments();
  const [editing, setEditing] = useState<Position | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Position | null>(null);
  const manage = can('position.manage');

  const columns: Column<Position>[] = [
    { key: 'code', header: t('departments.code'), sortable: true, cell: (p) => <span className="font-medium">{p.code}</span> },
    { key: i18n.language === 'lo' ? 'nameLo' : 'nameEn', header: t('positions.name'), sortable: true, cell: (p) => localName(p) },
    { key: 'department', header: t('employees.department'), cell: (p) => localName(p.department) },
    { key: 'employeeCount', header: t('departments.employeeCount'), align: 'right', cell: (p) => p.employeeCount },
    { key: 'isActive', header: t('common.status'), cell: (p) => <StatusBadge kind="account" value={p.isActive ? 'active' : 'inactive'} /> },
    ...(manage ? [{ key: 'actions', header: '', cell: (p: Position) => <RowActions name={localName(p)} onEdit={() => setEditing(p)} onDelete={() => setDeleting(p)} /> }] : []),
  ];

  return (
    <>
      <PageHeader title={t('positions.title')} actions={<PermissionGate permission="position.manage"><Button onClick={() => setEditing(null)}><Plus />{t('positions.add')}</Button></PermissionGate>} />
      <Card>
        <div className="flex flex-wrap gap-3 p-4">
          <SearchBar value={lq.searchInput} onChange={lq.setSearch} />
          <FilterDropdown label={t('employees.department')} value={lq.params.departmentId as string | undefined} onChange={(v) => lq.setFilter('departmentId', v)} allLabel={t('employees.allDepartments')} options={(depts.data ?? []).map((d) => ({ value: d.id, label: localName(d) }))} />
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
          emptyTitle={lq.params.search ? t('common.emptyFiltered') : t('positions.emptyTitle')}
        />
      </Card>
      <PositionFormDialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} position={editing} departments={depts.data ?? []} onSaved={q.reload} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('positions.confirmDelete', { name: deleting ? localName(deleting) : '' })}
        description={t('common.cannotUndo')}
        confirmLabel={t('common.delete')}
        tone="danger"
        onConfirm={async () => {
          try {
            await api.delete(`/positions/${deleting!.id}`);
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

import { Copy, KeyRound, Pencil, Plus, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable, type Column } from '../../components/common/DataTable';
import { FilterDropdown, SearchBar } from '../../components/common/inputs';
import { PageHeader, PermissionGate } from '../../components/common/layout-bits';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/useAuth';
import { cleanParams, useListQuery } from '../../hooks/useListQuery';
import { useQuery } from '../../hooks/useQuery';
import { api, type Page } from '../../lib/api';
import { toastError } from '../../lib/form-errors';
import { formatDateTime, fullName } from '../../lib/format';
import type { UserRow } from '../../lib/types';
import { UserFormDialog } from './UserFormDialog';

export function UsersPage() {
  const { t } = useTranslation();
  const { user: me, can } = useAuth();
  const lq = useListQuery({ sort: 'email:asc', filters: ['isActive', 'role'] });
  const q = useQuery(() => api.get<Page<UserRow>>('/users', { params: cleanParams(lq.params) }).then((r) => r.data), [lq.params]);
  const [editing, setEditing] = useState<UserRow | null | undefined>(undefined);
  const [toggle, setToggle] = useState<UserRow | null>(null);
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const manage = can('user.manage');

  const resetLink = async (u: UserRow) => {
    try {
      const r = await api.post(`/users/${u.id}/reset-link`);
      setLink(r.data.data);
    } catch (e) {
      toastError(e);
    }
  };

  const columns: Column<UserRow>[] = [
    { key: 'email', header: t('users.email'), sortable: true, cell: (u) => <span className="font-medium">{u.email}</span> },
    { key: 'employee', header: t('users.employee'), cell: (u) => (u.employee ? `${fullName(u.employee)} (${u.employee.employeeCode})` : <span className="text-ink-muted">{t('users.noEmployee')}</span>) },
    { key: 'roles', header: t('users.roles'), cell: (u) => u.roles.map((r) => t(`roles.names.${r}`, { defaultValue: r })).join(', ') },
    { key: 'lastLoginAt', header: t('users.lastLogin'), sortable: true, cell: (u) => <span className="tabular">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : t('users.never')}</span> },
    { key: 'isActive', header: t('common.status'), cell: (u) => <StatusBadge kind="account" value={u.isActive ? 'active' : 'inactive'} /> },
    ...(manage
      ? [{
          key: 'actions', header: '',
          cell: (u: UserRow) => (
            <div className="flex justify-end gap-1">
              <Button variant="subtle" size="iconSm" aria-label={`${t('common.edit')} ${u.email}`} onClick={() => setEditing(u)}><Pencil /></Button>
              <Button variant="subtle" size="iconSm" aria-label={`${t('users.resetLink')} ${u.email}`} onClick={() => resetLink(u)}><KeyRound /></Button>
              {u.id !== me?.id && (
                <Button variant="subtle" size="iconSm" aria-label={`${u.isActive ? t('users.deactivate') : t('users.activate')} ${u.email}`} onClick={() => setToggle(u)}>
                  {u.isActive ? <UserX /> : <UserCheck />}
                </Button>
              )}
            </div>
          ),
        }]
      : []),
  ];

  return (
    <>
      <PageHeader title={t('users.title')} actions={<PermissionGate permission="user.manage"><Button onClick={() => setEditing(null)}><Plus />{t('users.add')}</Button></PermissionGate>} />
      <Card>
        <div className="flex flex-wrap gap-3 p-4">
          <SearchBar value={lq.searchInput} onChange={lq.setSearch} />
          <FilterDropdown label={t('users.roles')} value={lq.params.role as string | undefined} onChange={(v) => lq.setFilter('role', v)} allLabel={t('common.all')} options={['super_admin', 'hr_admin', 'manager', 'employee'].map((r) => ({ value: r, label: t(`roles.names.${r}`) }))} />
          <FilterDropdown label={t('common.status')} value={lq.params.isActive as string | undefined} onChange={(v) => lq.setFilter('isActive', v)} allLabel={t('common.all')} options={[{ value: 'true', label: t('common.active') }, { value: 'false', label: t('common.inactive') }]} />
        </div>
        <DataTable columns={columns} rows={q.data?.data ?? []} total={q.data?.meta.total ?? 0} params={lq.params} loading={q.loading} error={q.error} onRetry={q.reload} onSortChange={lq.setSort} onPageChange={lq.setPage} emptyTitle={t('users.emptyTitle')} />
      </Card>
      <UserFormDialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} user={editing} onSaved={q.reload} />
      <ConfirmDialog
        open={!!toggle}
        onOpenChange={(o) => !o && setToggle(null)}
        title={toggle?.isActive ? t('users.confirmDeactivate', { email: toggle.email }) : t('users.activate')}
        confirmLabel={toggle?.isActive ? t('users.deactivate') : t('users.activate')}
        tone={toggle?.isActive ? 'danger' : 'primary'}
        onConfirm={async () => {
          try { await api.patch(`/users/${toggle!.id}/status`, { isActive: !toggle!.isActive }); toast.success(t('common.saved')); void q.reload(); } catch (e) { toastError(e); }
        }}
      />
      <Dialog open={!!link} onOpenChange={(o) => !o && setLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.resetLinkTitle')}</DialogTitle>
            <DialogDescription>{link && t('users.resetLinkHint', { time: formatDateTime(link.expiresAt) })}</DialogDescription>
          </DialogHeader>
          <DialogBody><Input readOnly value={link?.url ?? ''} onFocus={(e) => e.target.select()} aria-label={t('users.resetLinkTitle')} /></DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLink(null)}>{t('common.close')}</Button>
            <Button onClick={async () => { try { await navigator.clipboard.writeText(link!.url); toast.success(t('users.copied')); } catch { /* clipboard unavailable: the field is selectable */ } }}><Copy />{t('users.copy')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { Lock, Pencil, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { FormField } from '../../components/common/FormField';
import { SelectInput } from '../../components/common/inputs';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/layout-bits';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, apiError } from '../../lib/api';
import type { Role } from '../../lib/types';

function RoleEditor({ role, open, onOpenChange, permissions, onSaved }: { role: Role | null; open: boolean; onOpenChange: (o: boolean) => void; permissions: { code: string; module: string }[]; onSaved: () => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ code: '', nameLo: '', nameEn: '', scope: 'self' as Role['scope'] });
  const [codes, setCodes] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setF({ code: role?.code ?? '', nameLo: role?.nameLo ?? '', nameEn: role?.nameEn ?? '', scope: role?.scope ?? 'self' });
      setCodes(new Set(role?.permissionCodes ?? []));
      setErrors({});
    }
  }, [open, role]);
  const byModule = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of permissions) m.set(p.module, [...(m.get(p.module) ?? []), p.code]);
    return [...m.entries()];
  }, [permissions]);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!role && !/^[a-z0-9_]{2,40}$/.test(f.code)) e.code = 'errors.validation.code';
    if (!f.nameLo.trim()) e.nameLo = 'errors.validation.required';
    if (!f.nameEn.trim()) e.nameEn = 'errors.validation.required';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const body = { nameLo: f.nameLo, nameEn: f.nameEn, scope: f.scope, permissionCodes: [...codes] };
      if (role) await api.put(`/roles/${role.id}`, body);
      else await api.post('/roles', { ...body, code: f.code });
      toast.success(t('common.saved'));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const info = apiError(err);
      if (info.messageKey === 'errors.common.duplicate') setErrors({ code: info.messageKey });
      else toast.error(t(info.messageKey));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent wide>
        <DialogHeader>
          <DialogTitle>{role ? t('roles.editTitle') : t('roles.add')}</DialogTitle>
          <DialogDescription className="sr-only">{t('roles.title')}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('roles.code')} required error={errors.code}><Input value={f.code} disabled={!!role} onChange={(e) => setF({ ...f, code: e.target.value })} /></FormField>
            <FormField label={t('roles.scope')}>
              <SelectInput value={f.scope} onChange={(v) => setF({ ...f, scope: v as Role['scope'] })} options={(['all', 'department', 'self'] as const).map((s) => ({ value: s, label: t(`roles.scopes.${s}`) }))} />
            </FormField>
            <FormField label={t('departments.nameLo')} required error={errors.nameLo}><Input value={f.nameLo} onChange={(e) => setF({ ...f, nameLo: e.target.value })} /></FormField>
            <FormField label={t('departments.nameEn')} required error={errors.nameEn}><Input value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} /></FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {byModule.map(([module, list]) => (
              <fieldset key={module} role="group" aria-label={t(`roles.modules.${module}`, { defaultValue: module })} className="rounded-sm border border-border p-3">
                <legend className="px-1 text-label">{t(`roles.modules.${module}`, { defaultValue: module })}</legend>
                <div className="flex flex-col gap-2">
                  {list.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-body-sm">
                      <Checkbox aria-label={c} checked={codes.has(c)} onCheckedChange={(v) => setCodes((cur) => { const n = new Set(cur); if (v === true) n.add(c); else n.delete(c); return n; })} />
                      <code className="text-ink-muted">{c}</code>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={save} loading={busy}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RolesPage() {
  const { t } = useTranslation();
  const roles = useQuery(() => api.get<{ data: Role[] }>('/roles').then((r) => r.data.data), []);
  const perms = useQuery(() => api.get<{ data: { code: string; module: string }[] }>('/permissions').then((r) => r.data.data), []);
  const [editing, setEditing] = useState<Role | null | undefined>(undefined);

  return (
    <>
      <PageHeader title={t('roles.title')} actions={<Button onClick={() => setEditing(null)}><Plus />{t('roles.add')}</Button>} />
      {roles.loading ? <LoadingState /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(roles.data ?? []).map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-subhead">{localName(r)}</h2>
                  <p className="text-body-sm text-ink-muted">{r.code} · {t(`roles.scopes.${r.scope}`)} · {r.userCount} {t('roles.userCount')}</p>
                </div>
                {r.code === 'super_admin' ? <Lock className="size-5 text-ink-muted" aria-hidden /> : (
                  <Button variant="subtle" size="iconSm" aria-label={`${t('common.edit')} ${localName(r)}`} onClick={() => setEditing(r)}><Pencil /></Button>
                )}
              </div>
              {r.code === 'super_admin' ? <p className="text-body-sm text-ink-muted">{t('roles.locked')}</p> : (
                <p className="text-body-sm text-ink-muted">{t('roles.permissions')}: {r.permissionCodes.length}</p>
              )}
            </Card>
          ))}
        </div>
      )}
      <RoleEditor role={editing ?? null} open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} permissions={perms.data ?? []} onSaved={roles.reload} />
    </>
  );
}

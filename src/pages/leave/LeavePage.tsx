import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { PageHeader } from '../../components/common/layout-bits';
import { useAuth } from '../../auth/useAuth';
import { useQuery } from '../../hooks/useQuery';
import { api } from '../../lib/api';
import type { LeaveBalance, LeaveType } from '../../lib/types';
import { BalancesCard } from './BalancesCard';
import { HolidaysAdmin, LeaveTypesAdmin } from './LeaveAdmin';
import { LeaveRequestForm } from './LeaveRequestForm';
import { LeaveRequestList } from './LeaveRequestList';

export function LeavePage() {
  const { t } = useTranslation();
  const { can, user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const canRequest = can('leave.request') && !!user?.employee;

  const tabs = [
    canRequest && 'mine',
    can('leave.approve') && 'approvals',
    user?.scope !== 'self' && 'all',
    can('leave.manage') && 'types',
    can('leave.manage') && 'holidays',
  ].filter(Boolean) as string[];
  const tab = tabs.includes(sp.get('tab') ?? '') ? sp.get('tab')! : tabs[0];

  const types = useQuery(() => api.get<{ data: LeaveType[] }>('/leave-types').then((r) => r.data.data), [refresh]);
  const balances = useQuery(() => api.get<{ data: LeaveBalance[] }>('/leave-balances').then((r) => r.data.data), [refresh], canRequest);
  const bump = () => setRefresh((n) => n + 1);
  const label: Record<string, string> = { mine: t('leave.myRequests'), approvals: t('leave.approvals'), all: t('leave.all'), types: t('leave.types'), holidays: t('leave.holidays') };

  return (
    <>
      <PageHeader title={t('leave.title')} actions={canRequest && <Button onClick={() => setFormOpen(true)}><Plus />{t('leave.request')}</Button>} />
      {canRequest && <div className="mb-6"><BalancesCard balances={balances.data ?? []} /></div>}
      <Tabs value={tab} onValueChange={(v) => setSp((p) => { const n = new URLSearchParams(); n.set('tab', v); void p; return n; }, { replace: true })}>
        <TabsList>{tabs.map((k) => <TabsTrigger key={k} value={k}>{label[k]}</TabsTrigger>)}</TabsList>
        {tabs.includes('mine') && <TabsContent value="mine"><LeaveRequestList mode="mine" refreshKey={refresh} onChanged={bump} /></TabsContent>}
        {tabs.includes('approvals') && <TabsContent value="approvals"><LeaveRequestList mode="approvals" refreshKey={refresh} onChanged={bump} /></TabsContent>}
        {tabs.includes('all') && <TabsContent value="all"><LeaveRequestList mode="all" refreshKey={refresh} onChanged={bump} /></TabsContent>}
        {tabs.includes('types') && <TabsContent value="types"><LeaveTypesAdmin types={types.data ?? []} onChanged={bump} /></TabsContent>}
        {tabs.includes('holidays') && <TabsContent value="holidays"><HolidaysAdmin /></TabsContent>}
      </Tabs>
      <LeaveRequestForm open={formOpen} onOpenChange={setFormOpen} types={types.data ?? []} balances={balances.data ?? []} onSaved={bump} />
    </>
  );
}

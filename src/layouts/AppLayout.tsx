import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as D from '@radix-ui/react-dialog';
import { useAuth } from '../auth/useAuth';
import { Brand, Sidebar, SidebarNav } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { SheetContent } from '../components/ui/dialog';
import { usePendingApprovals } from '../hooks/usePendingApprovals';

export function AppLayout() {
  const { can } = useAuth();
  const { t } = useTranslation();
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  useEffect(() => setDrawer(false), [location.pathname]);
  const pending = usePendingApprovals(can('leave.approve'), location.pathname);
  const badges = { leave: pending };

  return (
    <div className="flex min-h-screen">
      <Sidebar can={can} badges={badges} />
      <D.Root open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="overflow-y-auto bg-brand p-4" aria-describedby={undefined}>
          <D.Title className="sr-only">{t('common.menu')}</D.Title>
          <Brand />
          <SidebarNav can={can} badges={badges} onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </D.Root>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setDrawer(true)} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

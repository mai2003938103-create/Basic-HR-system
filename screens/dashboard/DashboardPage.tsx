import { ArrowRight, CalendarClock, CalendarDays, Users, UsersRound } from 'lucide-react';
import { Link } from '@/lib/router';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DashboardCard, PageHeader } from '../../components/common/layout-bits';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../auth/useAuth';
import { useQuery } from '../../hooks/useQuery';
import { api, apiError } from '../../lib/api';
import { fullName, todayLocal } from '../../lib/format';
import { BarsChart } from './charts';
import { TodayTeamCard } from './TodayTeamCard';

/** `notCheckedInToday` is new in the Stage 2 contract; without it `absentToday` still means "absent or not yet in". */
interface Summary { totalEmployees: number; activeEmployees: number; inactiveEmployees: number; departments: number; presentToday: number; absentToday: number; notCheckedInToday?: number; onLeaveToday: number; pendingLeave: number }
interface Charts {
  byStatus: { status: string; count: number }[];
  attendance30d: { date: string; present: number; late: number; half_day: number; absent: number; leave: number }[];
  byDepartment: { departmentId: string; nameLo: string; nameEn: string; count: number }[];
  hiresByMonth: { month: string; count: number }[];
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { user, can } = useAuth();
  const summary = useQuery(() => api.get<{ data: Summary }>('/dashboard/summary').then((r) => r.data.data), []);
  const charts = useQuery(() => api.get<{ data: Charts }>('/dashboard/charts').then((r) => r.data.data), []);
  const today = todayLocal();
  const link = (to: string, perm: string) => (can(perm) ? to : undefined);
  // Company-wide roles see organisation figures; managers see their team in "today's team".
  const company = user?.scope === 'all';

  const s = summary.data;
  const c = charts.data;
  // Half days count as present in the 30-day view; four series keep the hue order fixed.
  const attendance = (c?.attendance30d ?? []).map((d) => ({ ...d, present: d.present + d.half_day }));

  return (
    <>
      <PageHeader showTitle title={t('dashboard.title')} subtitle={user?.employee ? t('dashboard.greeting', { name: fullName(user.employee) }) : user?.email} />
      {/* Managers already see their team's numbers in "today's team"; the company figures are for HR. */}
      {company && (summary.error ? <ErrorState onRetry={summary.reload} message={apiError(summary.error).messageKey} /> : !s ? <LoadingState rows={2} /> : (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-4">
          <DashboardCard tone="featured" icon={Users} label={t('dashboard.totalEmployees')} value={s.totalEmployees} meta={t('dashboard.activeN', { n: s.activeEmployees })} to={link('/employees', 'employee.read')} />
          <DashboardCard icon={UsersRound} label={t('dashboard.presentToday')} value={s.presentToday} to={link(`/attendance?from=${today}&to=${today}`, 'attendance.read')} />
          <DashboardCard icon={CalendarDays} label={t('dashboard.onLeaveToday')} value={s.onLeaveToday} to={link('/leave?tab=all', 'leave.read')} />
          <DashboardCard tone="warning" icon={CalendarClock} label={t('dashboard.pendingLeave')} value={s.pendingLeave} to={link('/leave?tab=approvals', 'leave.approve')} />
        </div>
      ))}
      {can('attendance.read') && user?.scope !== 'self' && <TodayTeamCard />}
      {charts.error ? <ErrorState onRetry={charts.reload} message={apiError(charts.error).messageKey} /> : !c ? <LoadingState rows={4} /> : (
        <section>
          <BarsChart
            title={t('dashboard.attendance30d')}
            rows={attendance}
            x="date"
            // ISO date → DD/MM, independent of the display locale's date order.
            xFormat={(d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`}
            series={[
              { key: 'present', label: t('status.attendance.present'), color: 'var(--chart-1)' },
              { key: 'late', label: t('status.attendance.late'), color: 'var(--chart-2)' },
              { key: 'leave', label: t('status.attendance.leave'), color: 'var(--chart-3)' },
              { key: 'absent', label: t('status.attendance.absent'), color: 'var(--chart-4)' },
            ]}
          />
          {can('report.view') && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" asChild><Link to="/reports">{t('dashboard.moreReports')}<ArrowRight /></Link></Button>
            </div>
          )}
        </section>
      )}
    </>
  );
}

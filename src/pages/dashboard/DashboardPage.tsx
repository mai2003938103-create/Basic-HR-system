import { Building2, CalendarClock, CalendarDays, UserCheck, UserMinus, UserX, Users, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DashboardCard, PageHeader } from '../../components/common/layout-bits';
import { useAuth } from '../../auth/useAuth';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, apiError } from '../../lib/api';
import { formatDate, fullName, todayLocal } from '../../lib/format';
import { BarsChart, RankedBars } from './charts';

interface Summary { totalEmployees: number; activeEmployees: number; inactiveEmployees: number; departments: number; presentToday: number; absentToday: number; onLeaveToday: number; pendingLeave: number }
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

  const s = summary.data;
  const c = charts.data;
  // Half days count as present in the 30-day view; four series keep the hue order fixed.
  const attendance = (c?.attendance30d ?? []).map((d) => ({ ...d, present: d.present + d.half_day }));

  return (
    <>
      <PageHeader title={t('dashboard.title')} subtitle={user?.employee ? t('dashboard.greeting', { name: fullName(user.employee) }) : user?.email} />
      {summary.error ? <ErrorState onRetry={summary.reload} message={apiError(summary.error).messageKey} /> : !s ? <LoadingState rows={2} /> : (
        <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard tone="featured" icon={Users} label={t('dashboard.totalEmployees')} value={s.totalEmployees} to={link('/employees', 'employee.read')} />
          <DashboardCard icon={UserCheck} label={t('dashboard.activeEmployees')} value={s.activeEmployees} to={link('/employees?status=active', 'employee.read')} />
          <DashboardCard icon={UserMinus} label={t('dashboard.inactiveEmployees')} value={s.inactiveEmployees} to={link('/employees?status=inactive', 'employee.read')} />
          <DashboardCard icon={Building2} label={t('dashboard.departments')} value={s.departments} to={link('/departments', 'department.read')} />
          <DashboardCard icon={UsersRound} label={t('dashboard.presentToday')} value={s.presentToday} to={link(`/attendance?from=${today}&to=${today}`, 'attendance.read')} />
          <DashboardCard tone="danger" icon={UserX} label={t('dashboard.absentToday')} value={s.absentToday} to={link(`/attendance?from=${today}&to=${today}&status=absent`, 'attendance.read')} />
          <DashboardCard icon={CalendarDays} label={t('dashboard.onLeaveToday')} value={s.onLeaveToday} to={link('/leave?tab=all', 'leave.read')} />
          <DashboardCard tone="warning" icon={CalendarClock} label={t('dashboard.pendingLeave')} value={s.pendingLeave} to={link('/leave?tab=approvals', 'leave.approve')} />
        </div>
      )}
      {charts.error ? <ErrorState onRetry={charts.reload} message={apiError(charts.error).messageKey} /> : !c ? <LoadingState rows={4} /> : (
        <div className="grid gap-6 lg:grid-cols-3">
          <BarsChart
            className="lg:col-span-2"
            title={t('dashboard.attendance30d')}
            rows={attendance}
            x="date"
            xFormat={(d) => formatDate(d).slice(0, 5)}
            series={[
              { key: 'present', label: t('status.attendance.present'), color: 'var(--chart-1)' },
              { key: 'late', label: t('status.attendance.late'), color: 'var(--chart-2)' },
              { key: 'leave', label: t('status.attendance.leave'), color: 'var(--chart-3)' },
              { key: 'absent', label: t('status.attendance.absent'), color: 'var(--chart-4)' },
            ]}
          />
          <RankedBars title={t('dashboard.byDepartment')} rows={c.byDepartment.map((d) => ({ label: localName(d), value: d.count }))} />
          <BarsChart
            className="lg:col-span-2"
            title={t('dashboard.hiresByMonth')}
            rows={c.hiresByMonth}
            x="month"
            xFormat={(m) => `${m.slice(5, 7)}/${m.slice(2, 4)}`}
            series={[{ key: 'count', label: t('dashboard.hires'), color: 'var(--chart-1)' }]}
            height={220}
          />
          <RankedBars title={t('dashboard.byStatus')} rows={c.byStatus.map((x) => ({ label: t(`status.employment.${x.status}`), value: x.count }))} />
        </div>
      )}
    </>
  );
}

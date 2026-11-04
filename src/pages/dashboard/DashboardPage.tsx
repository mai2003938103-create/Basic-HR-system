import { Building2, CalendarClock, CalendarDays, Clock, UserCheck, UserMinus, UserX, Users, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DashboardCard, PageHeader } from '../../components/common/layout-bits';
import { useAuth } from '../../auth/useAuth';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api, apiError } from '../../lib/api';
import { formatDate, fullName, todayLocal } from '../../lib/format';
import { CheckInCard } from '../attendance/CheckInCard';
import { ApprovalsCard } from './ApprovalsCard';
import { BarsChart, RankedBars } from './charts';
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
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);
  const summary = useQuery(() => api.get<{ data: Summary }>('/dashboard/summary').then((r) => r.data.data), [tick]);
  const charts = useQuery(() => api.get<{ data: Charts }>('/dashboard/charts').then((r) => r.data.data), []);
  const today = todayLocal();
  const link = (to: string, perm: string) => (can(perm) ? to : undefined);
  // Company-wide roles see organisation figures; managers see their team and act on what waits for them.
  const company = user?.scope === 'all';
  const showCheckIn = can('attendance.check') && !!user?.employee;
  const canApprove = can('leave.approve');

  const s = summary.data;
  const split = s?.notCheckedInToday !== undefined;
  const c = charts.data;
  // Half days count as present in the 30-day view; four series keep the hue order fixed.
  const attendance = (c?.attendance30d ?? []).map((d) => ({ ...d, present: d.present + d.half_day }));

  return (
    <>
      <PageHeader title={t('dashboard.title')} subtitle={user?.employee ? t('dashboard.greeting', { name: fullName(user.employee) }) : user?.email} />
      {(showCheckIn || canApprove) && (
        <div className={cn('mb-6 grid items-start gap-6', showCheckIn && canApprove && 'lg:grid-cols-2')}>
          {showCheckIn && <CheckInCard onChange={refresh} />}
          {canApprove && <ApprovalsCard onDecided={refresh} />}
        </div>
      )}
      {summary.error ? <ErrorState onRetry={summary.reload} message={apiError(summary.error).messageKey} /> : !s ? <LoadingState rows={2} /> : (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-4">
          <DashboardCard tone="featured" icon={Users} label={t(company ? 'dashboard.totalEmployees' : 'dashboard.teamSize')} value={company ? s.totalEmployees : s.activeEmployees} to={link('/employees', 'employee.read')} />
          {company && <DashboardCard icon={UserCheck} label={t('dashboard.activeEmployees')} value={s.activeEmployees} to={link('/employees?status=active', 'employee.read')} />}
          {company && !split && <DashboardCard icon={UserMinus} label={t('dashboard.inactiveEmployees')} value={s.inactiveEmployees} to={link('/employees?status=inactive', 'employee.read')} />}
          {company && <DashboardCard icon={Building2} label={t('dashboard.departments')} value={s.departments} to={link('/departments', 'department.read')} />}
          <DashboardCard icon={UsersRound} label={t('dashboard.presentToday')} value={s.presentToday} to={link(`/attendance?from=${today}&to=${today}`, 'attendance.read')} />
          {split ? (
            <>
              <DashboardCard icon={Clock} label={t('dashboard.notCheckedIn')} value={s.notCheckedInToday} meta={t('dashboard.notCheckedInHint')} />
              {company && <DashboardCard tone="danger" icon={UserX} label={t('dashboard.absentRecorded')} value={s.absentToday} to={link(`/attendance?from=${today}&to=${today}&status=absent`, 'attendance.read')} />}
            </>
          ) : (
            <DashboardCard tone="danger" icon={UserX} label={t('dashboard.absentToday')} value={s.absentToday} to={link(`/attendance?from=${today}&to=${today}&status=absent`, 'attendance.read')} />
          )}
          <DashboardCard icon={CalendarDays} label={t('dashboard.onLeaveToday')} value={s.onLeaveToday} to={link('/leave?tab=all', 'leave.read')} />
          {company && <DashboardCard tone="warning" icon={CalendarClock} label={t('dashboard.pendingLeave')} value={s.pendingLeave} to={link('/leave?tab=approvals', 'leave.approve')} />}
        </div>
      )}
      {can('attendance.read') && user?.scope !== 'self' && <TodayTeamCard refreshKey={tick} />}
      {charts.error ? <ErrorState onRetry={charts.reload} message={apiError(charts.error).messageKey} /> : !c ? <LoadingState rows={4} /> : (
        <div className="grid gap-6 lg:grid-cols-3">
          <BarsChart
            className={company ? 'lg:col-span-2' : 'lg:col-span-3'}
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
          {company && <RankedBars title={t('dashboard.byDepartment')} rows={c.byDepartment.map((d) => ({ label: localName(d), value: d.count }))} />}
          {company && <BarsChart
            className="lg:col-span-2"
            title={t('dashboard.hiresByMonth')}
            rows={c.hiresByMonth}
            x="month"
            xFormat={(m) => `${m.slice(5, 7)}/${m.slice(2, 4)}`}
            series={[{ key: 'count', label: t('dashboard.hires'), color: 'var(--chart-1)' }]}
            height={220}
          />}
          {company && <RankedBars title={t('dashboard.byStatus')} rows={c.byStatus.map((x) => ({ label: t(`status.employment.${x.status}`), value: x.count }))} />}
        </div>
      )}
    </>
  );
}

import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { useQuery } from '../../hooks/useQuery';
import { localName } from '../../i18n';
import { api } from '../../lib/api';
import { formatDate, formatTime, fullName } from '../../lib/format';
import type { Named } from '../../lib/types';
import { Avatar } from '../employees/Avatar';

interface Person { id: string; employeeCode: string; firstName: string; lastName: string; photoUrl: string | null; department: Named | null }
interface Today {
  date: string; isWorkingDay: boolean; workStart: string; present: number; total: number;
  notCheckedIn: Person[]; late: (Person & { checkInAt: string; lateMinutes: number })[]; onLeave: (Person & { leaveType: Named | null; endDate: string })[];
}

const SHOW = 6;

function Column({ title, tone, people, meta, empty, more }: { title: string; tone: string; people: Person[]; meta: (p: Person) => string; empty: string; more: (n: number) => string }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 flex items-center gap-2 text-label">
        <span aria-hidden className={`size-2 rounded-full ${tone}`} />
        {title} <span className="tabular text-ink-muted">({people.length})</span>
      </h3>
      {people.length === 0 ? <p className="text-body-sm text-ink-muted">{empty}</p> : (
        <ul className="flex flex-col gap-2">
          {people.slice(0, SHOW).map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <Avatar employee={p} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-body-sm font-medium">{fullName(p)}</span>
                <span className="tabular block truncate text-caption font-normal text-ink-muted">{meta(p)}</span>
              </span>
            </li>
          ))}
          {people.length > SHOW && <li className="text-body-sm text-ink-muted">{more(people.length - SHOW)}</li>}
        </ul>
      )}
    </section>
  );
}

/**
 * Who has not arrived, who came late and who is on leave today. New in the Stage 2 contract
 * (`GET /dashboard/today`); hidden when the server does not offer it.
 */
export function TodayTeamCard({ refreshKey }: { refreshKey?: number }) {
  const { t } = useTranslation();
  const q = useQuery(() => api.get<{ data: Today }>('/dashboard/today').then((r) => r.data.data), [refreshKey]);
  const d = q.data;
  if (q.error || !d) return null;
  const more = (n: number) => t('dashboard.andMore', { n });
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-subhead">{t('dashboard.todayTeam', { present: d.present, total: d.total })}</CardTitle>
        <Button variant="ghost" size="sm" asChild><Link to={`/attendance?from=${d.date}&to=${d.date}`}>{t('dashboard.openAttendance')}<ArrowRight /></Link></Button>
      </CardHeader>
      {!d.isWorkingDay ? <p className="px-6 pb-6 text-body-sm text-ink-muted">{t('attendance.notWorkingDay')}</p> : (
        <div className="grid gap-6 p-6 sm:grid-cols-3">
          <Column title={t('dashboard.notCheckedIn')} tone="bg-ink-muted" people={d.notCheckedIn} meta={(p) => localName(p.department)} empty={t('dashboard.everyoneIn')} more={more} />
          <Column title={t('status.attendance.late')} tone="bg-warning" people={d.late} meta={(p) => { const x = p as Today['late'][number]; return `${formatTime(x.checkInAt)} · ${t('attendance.lateBy', { n: x.lateMinutes })}`; }} empty={t('dashboard.nobodyLate')} more={more} />
          <Column title={t('status.attendance.leave')} tone="bg-primary" people={d.onLeave} meta={(p) => { const x = p as Today['onLeave'][number]; return `${localName(x.leaveType)} · ${t('dashboard.untilDate', { date: formatDate(x.endDate) })}`; }} empty={t('dashboard.nobodyOnLeave')} more={more} />
        </div>
      )}
    </Card>
  );
}

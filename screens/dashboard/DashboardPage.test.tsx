import { screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { renderApp } from '../../test/render';
import { http, HttpResponse, me, server, sessionHandlers } from '../../test/server';

const summary = { totalEmployees: 128, activeEmployees: 120, inactiveEmployees: 8, departments: 6, presentToday: 100, absentToday: 12, onLeaveToday: 8, pendingLeave: 5 };
const charts = {
  byStatus: [{ status: 'active', count: 110 }, { status: 'probation', count: 10 }, { status: 'inactive', count: 8 }],
  attendance30d: Array.from({ length: 30 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, present: 90, late: 5, half_day: 1, absent: 3, leave: 2 })),
  byDepartment: [{ departmentId: 'd1', nameLo: 'ການເງິນ', nameEn: 'Finance', count: 20 }],
  hiresByMonth: Array.from({ length: 12 }, (_, i) => ({ month: `2026-${String(i + 1).padStart(2, '0')}`, count: i })),
};

const extras = (pending: unknown[] = []) => [
  http.get('/api/attendance/today', () => HttpResponse.json({ data: { date: '2026-11-04', isWorkingDay: true, onLeave: false, record: null } })),
  http.get('/api/leave-requests', () => HttpResponse.json({ data: pending, meta: { page: 1, pageSize: 5, total: pending.length } })),
  http.get('/api/dashboard/today', () => HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'errors.common.notFound' } }, { status: 404 })),
];
const pendingRequest = {
  id: 'l1', employee: { id: 'e9', firstName: 'ບຸນມີ', lastName: 'ແກ້ວ', employeeCode: 'E9', departmentId: 'd1' }, leaveType: { id: 't1', code: 'ANNUAL', nameLo: 'ລາພັກປະຈຳປີ', nameEn: 'Annual' },
  startDate: '2026-11-10', endDate: '2026-11-11', halfDay: 'none', days: 2, reason: 'ກັບບ້ານ', documentUrl: null, status: 'pending', approver: null, decidedAt: null, decisionNote: null, createdAt: '2026-11-03T02:00:00Z', canApprove: true, canCancel: false,
};

describe('DashboardPage', () => {
  it('shows four company stat cards with one featured card, linked to modules', async () => {
    server.use(...sessionHandlers(), ...extras(), http.get('/api/dashboard/summary', () => HttpResponse.json({ data: summary })), http.get('/api/dashboard/charts', () => HttpResponse.json({ data: charts })));
    renderApp(<DashboardPage />);
    expect(await screen.findByText('128')).toBeInTheDocument();
    const cards = screen.getAllByTestId('stat-card');
    expect(cards).toHaveLength(4);
    expect(cards.filter((c) => c.className.includes('bg-brand'))).toHaveLength(1);
    expect(screen.getByRole('link', { name: /ຄຳຮ້ອງລາລໍຖ້າ/ })).toHaveAttribute('href', '/leave?tab=approvals');
    expect(screen.getByRole('heading', { name: 'ການເຂົ້າວຽກ 30 ວັນຜ່ານມາ' })).toBeInTheDocument();
    expect(screen.getAllByText('ມາເຮັດວຽກ').length).toBeGreaterThan(0); // translated legend
  });

  it('shows an error state with retry', async () => {
    server.use(...sessionHandlers(), ...extras(), http.get('/api/dashboard/summary', () => HttpResponse.json({ error: { code: 'INTERNAL', message: 'errors.common.internal' } }, { status: 500 })), http.get('/api/dashboard/charts', () => HttpResponse.json({ data: charts })));
    renderApp(<DashboardPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'ລອງໃໝ່' })).toBeInTheDocument());
  });

  it('shows a manager no company stat cards and none of the removed task cards', async () => {
    const manager = me({ roles: ['manager'], scope: 'department', permissions: ['employee.read', 'attendance.read', 'attendance.check', 'leave.read', 'leave.request', 'leave.approve', 'dashboard.view'] });
    server.use(
      ...sessionHandlers(manager), ...extras([pendingRequest]),
      http.get('/api/dashboard/summary', () => HttpResponse.json({ data: summary })),
      http.get('/api/dashboard/charts', () => HttpResponse.json({ data: charts })),
    );
    renderApp(<DashboardPage />);
    await screen.findByRole('heading', { name: 'ການເຂົ້າວຽກ 30 ວັນຜ່ານມາ' });
    expect(screen.queryAllByTestId('stat-card')).toHaveLength(0);
    expect(screen.queryByRole('heading', { name: /ລໍຖ້າທ່ານອະນຸມັດ/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ລົງເວລາເຂົ້າວຽກ/ })).not.toBeInTheDocument();
  });
});

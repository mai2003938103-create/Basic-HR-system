import { screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { renderApp } from '../../test/render';
import { http, HttpResponse, server, sessionHandlers } from '../../test/server';

const summary = { totalEmployees: 128, activeEmployees: 120, inactiveEmployees: 8, departments: 6, presentToday: 100, absentToday: 12, onLeaveToday: 8, pendingLeave: 5 };
const charts = {
  byStatus: [{ status: 'active', count: 110 }, { status: 'probation', count: 10 }, { status: 'inactive', count: 8 }],
  attendance30d: Array.from({ length: 30 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, present: 90, late: 5, half_day: 1, absent: 3, leave: 2 })),
  byDepartment: [{ departmentId: 'd1', nameLo: 'ການເງິນ', nameEn: 'Finance', count: 20 }],
  hiresByMonth: Array.from({ length: 12 }, (_, i) => ({ month: `2026-${String(i + 1).padStart(2, '0')}`, count: i })),
};

describe('DashboardPage', () => {
  it('shows eight stat cards with one featured card, linked to modules', async () => {
    server.use(...sessionHandlers(), http.get('/api/dashboard/summary', () => HttpResponse.json({ data: summary })), http.get('/api/dashboard/charts', () => HttpResponse.json({ data: charts })));
    renderApp(<DashboardPage />);
    expect(await screen.findByText('128')).toBeInTheDocument();
    const cards = screen.getAllByTestId('stat-card');
    expect(cards).toHaveLength(8);
    expect(cards.filter((c) => c.className.includes('bg-brand'))).toHaveLength(1);
    expect(screen.getByRole('link', { name: /ຄຳຮ້ອງລາລໍຖ້າ/ })).toHaveAttribute('href', '/leave?tab=approvals');
    expect(screen.getByRole('heading', { name: 'ການເຂົ້າວຽກ 30 ວັນຜ່ານມາ' })).toBeInTheDocument();
    expect(screen.getAllByText('ມາເຮັດວຽກ').length).toBeGreaterThan(0); // translated legend
  });

  it('shows an error state with retry', async () => {
    server.use(...sessionHandlers(), http.get('/api/dashboard/summary', () => HttpResponse.json({ error: { code: 'INTERNAL', message: 'errors.common.internal' } }, { status: 500 })), http.get('/api/dashboard/charts', () => HttpResponse.json({ data: charts })));
    renderApp(<DashboardPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'ລອງໃໝ່' })).toBeInTheDocument());
  });
});

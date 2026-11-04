import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeavePage } from './leave/LeavePage';
import { EmployeeDetailPage } from './employees/EmployeeDetailPage';
import { UsersPage } from './users/UsersPage';
import { renderApp } from '../test/render';
import { http, HttpResponse, me, server, sessionHandlers } from '../test/server';

const page = (rows: unknown[]) => HttpResponse.json({ data: rows, meta: { page: 1, pageSize: 20, total: rows.length } });
const ANNUAL = { id: 'lt-a', code: 'ANNUAL', nameLo: 'ລາພັກປະຈຳປີ', nameEn: 'Annual Leave', defaultDaysPerYear: 15, isPaid: true, documentRequiredAfterDays: null, isActive: true };

describe('final review fixes (web)', () => {
  it('lets HR cancel a future approved request from the all-requests tab', async () => {
    const req = { id: 'r1', employee: { id: 'e5', firstName: 'ວັນນາ', lastName: 'ສີຫາລາດ', employeeCode: 'E5', departmentId: 'd1' }, leaveType: ANNUAL, startDate: '2099-01-05', endDate: '2099-01-05', halfDay: 'none', days: 1, reason: 'x', documentUrl: null, status: 'approved', approver: null, decidedAt: null, decisionNote: null, createdAt: '2026-11-03T02:00:00Z', canApprove: false, canCancel: true };
    server.use(
      ...sessionHandlers(me({ employee: null })),
      http.get('/api/leave-types', () => HttpResponse.json({ data: [ANNUAL] })),
      http.get('/api/leave-requests', () => page([req])),
    );
    renderApp(<LeavePage />, { route: '/leave?tab=all' });
    expect(await screen.findByRole('button', { name: 'ຍົກເລີກຄຳຮ້ອງ' })).toBeInTheDocument();
  });

  it('shows and adjusts leave balances on the employee page for HR', async () => {
    let saved = 0;
    const emp = { id: 'e1000000-0000-4000-8000-000000000001', employeeCode: 'EMP1', firstName: 'ບຸນມີ', lastName: 'ພົມມະຈັນ', gender: 'male', dateOfBirth: '1990-01-01', phone: '0205550000', email: 'b@test.la', address: null, photoUrl: null, departmentId: 'd1', positionId: 'p1', hireDate: '2024-01-01', employmentStatus: 'active', basicSalary: '1', emergencyContactName: null, emergencyContactPhone: null, emergencyContactRelation: null, department: null, position: null, user: null };
    server.use(
      ...sessionHandlers(),
      http.get(`/api/employees/${emp.id}`, () => HttpResponse.json({ data: emp })),
      http.get('/api/leave-balances', ({ request }) => {
        expect(new URL(request.url).searchParams.get('employeeId')).toBe(emp.id);
        return HttpResponse.json({ data: [{ id: 'b1', employeeId: emp.id, year: 2026, leaveType: ANNUAL, entitledDays: 15, usedDays: 2, remainingDays: 13 }] });
      }),
      http.put('/api/leave-balances/b1', async ({ request }) => {
        saved = ((await request.json()) as { entitledDays: number }).entitledDays;
        return HttpResponse.json({ data: { id: 'b1', employeeId: emp.id, year: 2026, leaveType: ANNUAL, entitledDays: saved, usedDays: 2, remainingDays: saved - 2 } });
      }),
    );
    renderApp(<EmployeeDetailPage />, { route: `/employees/${emp.id}`, path: '/employees/:id' });
    await userEvent.click(await screen.findByRole('button', { name: 'ປັບສິດວັນລາ ລາພັກປະຈຳປີ' }));
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '18');
    await userEvent.click(within(dialog).getByRole('button', { name: 'ບັນທຶກ' }));
    await waitFor(() => expect(saved).toBe(18));
  });

  it('offers custom roles in the user form', async () => {
    server.use(
      ...sessionHandlers(),
      http.get('/api/users', () => page([])),
      http.get('/api/employees', () => page([])),
      http.get('/api/roles/assignable', () => HttpResponse.json({ data: [{ id: 'r1', code: 'employee', nameLo: 'ພະນັກງານ', nameEn: 'Employee', scope: 'self' }, { id: 'r9', code: 'payroll_clerk', nameLo: 'ພະນັກງານເງິນເດືອນ', nameEn: 'Payroll clerk', scope: 'all' }] })),
    );
    renderApp(<UsersPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'ເພີ່ມຜູ້ໃຊ້' }));
    expect(await within(await screen.findByRole('dialog')).findByText('ພະນັກງານເງິນເດືອນ')).toBeInTheDocument();
  });
});

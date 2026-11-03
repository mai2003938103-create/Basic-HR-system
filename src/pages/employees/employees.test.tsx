import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeFormPage } from './EmployeeFormPage';
import { EmployeeDetailPage } from './EmployeeDetailPage';
import { renderApp } from '../../test/render';
import { http, HttpResponse, me, server, sessionHandlers } from '../../test/server';

const D1 = { id: 'd1000000-0000-4000-8000-000000000001', code: 'FIN', nameLo: 'ການເງິນ', nameEn: 'Finance', description: null, isActive: true, manager: null, employeeCount: 0 };
const D2 = { ...D1, id: 'd2000000-0000-4000-8000-000000000002', code: 'IT', nameLo: 'ໄອທີ', nameEn: 'IT' };
const P1 = { id: 'p1000000-0000-4000-8000-000000000001', code: 'ACC', nameLo: 'ບັນຊີ', nameEn: 'Accountant', description: null, isActive: true, department: D1, employeeCount: 0 };
const P2 = { ...P1, id: 'p2000000-0000-4000-8000-000000000002', code: 'DEV', nameLo: 'ນັກພັດທະນາ', nameEn: 'Developer', department: D2 };

const lookups = () => [
  http.get('/api/departments', () => HttpResponse.json({ data: [D1, D2], meta: { page: 1, pageSize: 100, total: 2 } })),
  http.get('/api/positions', ({ request }) => {
    const d = new URL(request.url).searchParams.get('departmentId');
    const rows = [P1, P2].filter((p) => !d || p.department.id === d);
    return HttpResponse.json({ data: rows, meta: { page: 1, pageSize: 100, total: rows.length } });
  }),
];

const employee = {
  id: 'e1000000-0000-4000-8000-000000000001', employeeCode: 'EMP0001', firstName: 'ສົມພອນ', lastName: 'ແກ້ວມະນີ', gender: 'male', dateOfBirth: '1990-05-10',
  phone: '02055551234', email: 'somphone@test.la', address: null, photoUrl: null, departmentId: D1.id, positionId: P1.id, hireDate: '2024-03-01',
  employmentStatus: 'active', basicSalary: '8500000.00', emergencyContactName: null, emergencyContactPhone: null, emergencyContactRelation: null,
  department: D1, position: P1, user: null,
};

async function pick(label: RegExp | string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('EmployeeFormPage', () => {
  it('clears the position when the department changes', async () => {
    server.use(...sessionHandlers(), ...lookups());
    renderApp(<EmployeeFormPage />, { route: '/employees/new', path: '/employees/new' });
    await pick(/ພະແນກ/, 'ການເງິນ');
    await pick(/ຕຳແໜ່ງ/, 'ບັນຊີ');
    expect(screen.getByRole('combobox', { name: /ຕຳແໜ່ງ/ })).toHaveTextContent('ບັນຊີ');
    await pick(/ພະແນກ/, 'ໄອທີ');
    await waitFor(() => expect(screen.getByRole('combobox', { name: /ຕຳແໜ່ງ/ })).not.toHaveTextContent('ບັນຊີ'));
  });

  it('shows a duplicate employee ID from the server on the field', async () => {
    server.use(
      ...sessionHandlers(),
      ...lookups(),
      http.get(`/api/employees/${employee.id}`, () => HttpResponse.json({ data: employee })),
      http.put(`/api/employees/${employee.id}`, () => HttpResponse.json({ error: { code: 'CONFLICT', message: 'errors.common.duplicate' } }, { status: 409 })),
    );
    renderApp(<EmployeeFormPage />, { route: `/employees/${employee.id}/edit`, path: '/employees/:id/edit' });
    const code = await screen.findByLabelText(/ລະຫັດພະນັກງານ/);
    await waitFor(() => expect(code).toHaveValue('EMP0001'));
    await userEvent.click(screen.getByRole('button', { name: 'ບັນທຶກ' }));
    expect(await screen.findByText('ຂໍ້ມູນນີ້ມີຢູ່ແລ້ວ')).toBeInTheDocument();
  });
});

describe('EmployeeDetailPage', () => {
  it('deactivates after confirmation and updates the badge', async () => {
    let current = { ...employee };
    server.use(
      ...sessionHandlers(),
      http.get(`/api/employees/${employee.id}`, () => HttpResponse.json({ data: current })),
      http.get('/api/leave-balances', () => HttpResponse.json({ data: [] })),
      http.patch(`/api/employees/${employee.id}/status`, async ({ request }) => {
        const body = (await request.json()) as { status: string };
        current = { ...current, employmentStatus: body.status };
        return HttpResponse.json({ data: current });
      }),
    );
    renderApp(<EmployeeDetailPage />, { route: `/employees/${employee.id}`, path: '/employees/:id' });
    await userEvent.click(await screen.findByRole('button', { name: 'ປິດໃຊ້' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'ປິດໃຊ້' }));
    await waitFor(() => expect(screen.getAllByText('ປິດໃຊ້').some((el) => el.className.includes('rounded-pill'))).toBe(true));
  });

  it('shows no edit actions or salary to a manager', async () => {
    const { basicSalary: _s, ...noSalary } = employee;
    server.use(
      ...sessionHandlers(me({ roles: ['manager'], scope: 'department', permissions: ['employee.read', 'dashboard.view'] })),
      http.get(`/api/employees/${employee.id}`, () => HttpResponse.json({ data: noSalary })),
    );
    renderApp(<EmployeeDetailPage />, { route: `/employees/${employee.id}`, path: '/employees/:id' });
    await screen.findByText('ສົມພອນ ແກ້ວມະນີ');
    expect(screen.queryByRole('link', { name: /ແກ້ໄຂ/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'ປິດໃຊ້' })).toBeNull();
    expect(screen.queryByText('ເງິນເດືອນພື້ນຖານ')).toBeNull();
  });
});

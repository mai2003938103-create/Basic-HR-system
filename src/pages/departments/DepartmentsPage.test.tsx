import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DepartmentsPage } from './DepartmentsPage';
import { DepartmentDetailPage } from './DepartmentDetailPage';
import { renderApp } from '../../test/render';
import { http, HttpResponse, me, server, sessionHandlers } from '../../test/server';

const dept = { id: '11111111-1111-4111-8111-111111111111', code: 'FIN', nameLo: 'ພະແນກການເງິນ', nameEn: 'Finance', description: null, isActive: true, manager: null, employeeCount: 2 };
const list = (rows = [dept]) => http.get('/api/departments', () => HttpResponse.json({ data: rows, meta: { page: 1, pageSize: 20, total: rows.length } }));

describe('DepartmentsPage', () => {
  it('shows the Lao name and switches with the language', async () => {
    server.use(...sessionHandlers(), list());
    renderApp(<DepartmentsPage />);
    expect(await screen.findByText('ພະແນກການເງິນ')).toBeInTheDocument();
  });

  it('validates the form and shows a duplicate code error from the server', async () => {
    server.use(...sessionHandlers(), list(), http.post('/api/departments', () => HttpResponse.json({ error: { code: 'CONFLICT', message: 'errors.common.duplicate' } }, { status: 409 })));
    renderApp(<DepartmentsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'ເພີ່ມພະແນກ' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'ບັນທຶກ' }));
    expect((await within(dialog).findAllByText('ກະລຸນາປ້ອນຂໍ້ມູນນີ້')).length).toBeGreaterThanOrEqual(3);
    await userEvent.type(within(dialog).getByLabelText(/ລະຫັດ/), 'FIN');
    await userEvent.type(within(dialog).getByLabelText(/ຊື່ \(ລາວ\)/), 'ການເງິນ');
    await userEvent.type(within(dialog).getByLabelText(/ຊື່ \(ອັງກິດ\)/), 'Finance');
    await userEvent.click(within(dialog).getByRole('button', { name: 'ບັນທຶກ' }));
    expect(await within(dialog).findByText('ຂໍ້ມູນນີ້ມີຢູ່ແລ້ວ')).toBeInTheDocument();
  });

  it('shows the in-use message when delete is refused', async () => {
    server.use(...sessionHandlers(), list(), http.delete(`/api/departments/${dept.id}`, () => HttpResponse.json({ error: { code: 'CONFLICT', message: 'errors.department.inUse' } }, { status: 409 })));
    renderApp(<DepartmentsPage />);
    await userEvent.click(await screen.findByRole('button', { name: `ລຶບ ${dept.nameLo}` }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'ລຶບ' }));
    expect(await screen.findByText('ລຶບບໍ່ໄດ້: ພະແນກນີ້ຍັງມີພະນັກງານ ຫຼື ຕຳແໜ່ງ')).toBeInTheDocument();
  });

  it('hides write actions without department.manage', async () => {
    server.use(...sessionHandlers(me({ permissions: ['department.read'] })), list());
    renderApp(<DepartmentsPage />);
    await screen.findByText('ພະແນກການເງິນ');
    expect(screen.queryByRole('button', { name: 'ເພີ່ມພະແນກ' })).toBeNull();
    expect(screen.queryByRole('button', { name: `ລຶບ ${dept.nameLo}` })).toBeNull();
  });
});

describe('DepartmentDetailPage', () => {
  it('lists the department employees', async () => {
    server.use(
      ...sessionHandlers(),
      http.get(`/api/departments/${dept.id}`, () => HttpResponse.json({ data: dept })),
      http.get('/api/employees', ({ request }) => {
        expect(new URL(request.url).searchParams.get('departmentId')).toBe(dept.id);
        return HttpResponse.json({ data: [{ id: 'e1', employeeCode: 'E1', firstName: 'ບຸນມີ', lastName: 'ພົມມະຈັນ', employmentStatus: 'active', position: { nameLo: 'ບັນຊີ', nameEn: 'Accountant' } }], meta: { page: 1, pageSize: 100, total: 1 } });
      }),
      http.get('/api/positions', () => HttpResponse.json({ data: [], meta: { page: 1, pageSize: 100, total: 0 } })),
    );
    renderApp(<DepartmentDetailPage />, { route: `/departments/${dept.id}`, path: '/departments/:id' });
    await waitFor(() => expect(screen.getByText('ບຸນມີ ພົມມະຈັນ')).toBeInTheDocument());
  });
});

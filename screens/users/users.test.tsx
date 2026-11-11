import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersPage } from './UsersPage';
import { RolesPage } from './RolesPage';
import { ProfilePage } from '../profile/ProfilePage';
import { ProtectedRoute } from '../../auth/ProtectedRoute';
import { renderApp } from '../../test/render';
import { http, HttpResponse, me, server, sessionHandlers } from '../../test/server';

const user = (over = {}) => ({ id: 'u9', email: 'bob@test.la', isActive: true, mustChangePassword: false, lastLoginAt: null, employeeId: null, employee: null, roles: ['employee'], ...over });
const page = (rows: unknown[]) => HttpResponse.json({ data: rows, meta: { page: 1, pageSize: 20, total: rows.length } });

describe('UsersPage', () => {
  it('creates a reset link and shows it with its expiry', async () => {
    server.use(
      ...sessionHandlers(),
      http.get('/api/users', () => page([user(), user({ id: 'u1', email: 'hr@test.la', roles: ['hr_admin'] })])),
      http.post('/api/users/u9/reset-link', () => HttpResponse.json({ data: { url: 'http://localhost:5173/reset-password?token=abc', expiresAt: '2026-11-03T05:00:00Z' } })),
    );
    renderApp(<UsersPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'ສ້າງລິ້ງຕັ້ງລະຫັດໃໝ່ bob@test.la' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByDisplayValue('http://localhost:5173/reset-password?token=abc')).toBeInTheDocument();
    expect(within(dialog).getByText(/12:00/)).toBeInTheDocument();
  });

  it('does not offer deactivating yourself', async () => {
    server.use(...sessionHandlers(), http.get('/api/users', () => page([user({ id: 'u1', email: 'hr@test.la', roles: ['hr_admin'] }), user()])));
    renderApp(<UsersPage />);
    await screen.findByText('bob@test.la');
    expect(screen.getByRole('button', { name: 'ປິດບັນຊີ bob@test.la' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ປິດບັນຊີ hr@test.la' })).toBeNull();
  });
});

const roles = [
  { id: 'r-sa', code: 'super_admin', nameLo: 'ຜູ້ດູແລລະບົບສູງສຸດ', nameEn: 'Super Admin', scope: 'all', isSystem: true, permissionCodes: ['employee.read', 'leave.read'], userCount: 1 },
  { id: 'r-m', code: 'manager', nameLo: 'ຫົວໜ້າພະແນກ', nameEn: 'Manager', scope: 'department', isSystem: true, permissionCodes: ['employee.read'], userCount: 2 },
];
const perms = [{ code: 'employee.read', module: 'employee' }, { code: 'leave.read', module: 'leave' }, { code: 'leave.approve', module: 'leave' }];

describe('RolesPage', () => {
  it('edits permissions grouped by module and keeps super admin read-only', async () => {
    let saved: string[] = [];
    server.use(
      ...sessionHandlers(me({ permissions: [...me().permissions, 'role.manage'] })),
      http.get('/api/roles', () => HttpResponse.json({ data: roles })),
      http.get('/api/permissions', () => HttpResponse.json({ data: perms })),
      http.put('/api/roles/r-m', async ({ request }) => {
        saved = ((await request.json()) as { permissionCodes: string[] }).permissionCodes;
        return HttpResponse.json({ data: { ...roles[1], permissionCodes: saved } });
      }),
    );
    renderApp(<RolesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'ແກ້ໄຂ ຫົວໜ້າພະແນກ' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('group', { name: 'ການລາ' })).toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'ເບິ່ງຂໍ້ມູນພະນັກງານ' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'ອະນຸມັດການລາ' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'ບັນທຶກ' }));
    await waitFor(() => expect(saved.sort()).toEqual(['employee.read', 'leave.approve']));
    expect(screen.queryByRole('button', { name: 'ແກ້ໄຂ ຜູ້ດູແລລະບົບສູງສຸດ' })).toBeNull();
    expect(screen.getByText('ບົດບາດນີ້ມີສິດທັງໝົດ ແລະ ແກ້ໄຂບໍ່ໄດ້')).toBeInTheDocument();
  });

  it('is forbidden without role.manage', async () => {
    server.use(...sessionHandlers());
    renderApp(<ProtectedRoute permission="role.manage"><RolesPage /></ProtectedRoute>);
    expect(await screen.findByText('ທ່ານບໍ່ມີສິດເຂົ້າໜ້ານີ້')).toBeInTheDocument();
  });
});

describe('ProfilePage', () => {
  it('shows my employee record and the change password link', async () => {
    server.use(
      ...sessionHandlers(),
      http.get('/api/employees/me', () =>
        HttpResponse.json({ data: { id: 'e1', employeeCode: 'E1', firstName: 'ນາລີ', lastName: 'ວົງສະຫວັນ', gender: 'female', dateOfBirth: '1991-02-03', phone: '0205551111', email: 'hr@test.la', address: null, photoUrl: null, departmentId: 'd1', positionId: 'p1', hireDate: '2020-01-06', employmentStatus: 'active', basicSalary: '9000000.00', emergencyContactName: null, emergencyContactPhone: null, emergencyContactRelation: null, department: { id: 'd1', code: 'HR', nameLo: 'ບຸກຄະລາກອນ', nameEn: 'HR' }, position: { id: 'p1', code: 'HRM', nameLo: 'ຫົວໜ້າ', nameEn: 'Head' }, user: null } }),
      ),
    );
    renderApp(<ProfilePage />);
    expect(await screen.findByText('ນາລີ ວົງສະຫວັນ')).toBeInTheDocument();
    expect(screen.getByText('9,000,000 ₭')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ປ່ຽນລະຫັດຜ່ານ/ })).toHaveAttribute('href', '/change-password');
  });
});

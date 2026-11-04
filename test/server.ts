import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer();
export { http, HttpResponse };

export const me = (over: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'hr@test.la',
  mustChangePassword: false,
  roles: ['hr_admin'],
  permissions: [
    'attendance.check', 'attendance.manage', 'attendance.read', 'dashboard.view', 'department.manage', 'department.read',
    'employee.create', 'employee.delete', 'employee.read', 'employee.update', 'leave.approve', 'leave.manage', 'leave.read',
    'leave.request', 'position.manage', 'position.read', 'user.manage', 'user.read',
  ],
  scope: 'all',
  employee: { id: 'e1', employeeCode: 'E1', firstName: 'ນາລີ', lastName: 'ວົງສະຫວັນ', photoUrl: null, departmentId: 'd1' },
  ...over,
});

export const employeeMe = () =>
  me({ id: 'u2', email: 'emp@test.la', roles: ['employee'], scope: 'self', permissions: ['attendance.check', 'attendance.read', 'leave.read', 'leave.request'] });

/** Signed-in session via the refresh cookie. */
export const sessionHandlers = (user = me()) => [
  http.post('/api/auth/refresh', () => HttpResponse.json({ data: { accessToken: 'tok', user } })),
  http.get('/api/settings/public', () =>
    HttpResponse.json({ data: { companyNameLo: 'ຊິສໂຕຣີ', companyNameEn: 'Systory', logoUrl: null, currencyCode: 'LAK', currencySymbol: '₭', workingDays: [1, 2, 3, 4, 5], workStart: '08:00', workEnd: '17:00' } }),
  ),
  http.get('/api/notifications', () => HttpResponse.json({ data: [], meta: { page: 1, pageSize: 10, total: 0 }, unread: 0 })),
];
export const anonymousHandlers = () => [
  http.post('/api/auth/refresh', () => HttpResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'errors.auth.sessionExpired' } }, { status: 401 })),
];

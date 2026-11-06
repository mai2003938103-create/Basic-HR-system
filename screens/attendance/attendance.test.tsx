import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInCard } from './CheckInCard';
import { AttendancePage } from './AttendancePage';
import { renderApp } from '../../test/render';
import { employeeMe, http, HttpResponse, server, sessionHandlers } from '../../test/server';

const rec = (over = {}) => ({ id: 'a1', employeeId: 'e1', workDate: '2026-11-03', checkInAt: '2026-11-03T01:05:00Z', checkOutAt: null, workedMinutes: 0, lateMinutes: 0, earlyLeaveMinutes: 0, status: 'present', note: null, ...over });

describe('CheckInCard', () => {
  it('moves from check-in to check-out to done, blocking double clicks', async () => {
    let state: ReturnType<typeof rec> | null = null;
    let checkIns = 0;
    let release: () => void = () => {};
    server.use(
      ...sessionHandlers(employeeMe()),
      http.get('/api/attendance/today', () => HttpResponse.json({ data: { date: '2026-11-03', isWorkingDay: true, onLeave: false, record: state } })),
      http.post('/api/attendance/check-in', async () => {
        checkIns++;
        await new Promise<void>((r) => (release = r));
        state = rec();
        return HttpResponse.json({ data: state }, { status: 201 });
      }),
      http.post('/api/attendance/check-out', () => {
        state = rec({ checkOutAt: '2026-11-03T10:00:00Z', workedMinutes: 535 });
        return HttpResponse.json({ data: state });
      }),
    );
    renderApp(<CheckInCard />);
    const btn = await screen.findByRole('button', { name: 'ລົງເວລາເຂົ້າວຽກ' });
    await userEvent.click(btn);
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    release();
    expect(await screen.findByRole('button', { name: 'ລົງເວລາເລີກວຽກ' })).toBeInTheDocument();
    expect(checkIns).toBe(1);
    expect(screen.getByText('ເຂົ້າວຽກເວລາ 08:05')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'ລົງເວລາເລີກວຽກ' }));
    expect(await screen.findByText('ລົງເວລາຄົບແລ້ວມື້ນີ້')).toBeInTheDocument();
  });

  it('shows the translated reason when check-in is refused', async () => {
    server.use(
      ...sessionHandlers(employeeMe()),
      http.get('/api/attendance/today', () => HttpResponse.json({ data: { date: '2026-11-03', isWorkingDay: true, onLeave: false, record: null } })),
      http.post('/api/attendance/check-in', () => HttpResponse.json({ error: { code: 'CONFLICT', message: 'errors.attendance.alreadyCheckedIn' } }, { status: 409 })),
    );
    renderApp(<CheckInCard />);
    await userEvent.click(await screen.findByRole('button', { name: 'ລົງເວລາເຂົ້າວຽກ' }));
    expect(await screen.findByText('ທ່ານລົງເວລາເຂົ້າວຽກມື້ນີ້ແລ້ວ')).toBeInTheDocument();
  });
});

const listHandler = () =>
  http.get('/api/attendance', () =>
    HttpResponse.json({ data: [{ ...rec({ checkOutAt: '2026-11-03T10:00:00Z', workedMinutes: 535 }), employee: { id: 'e9', employeeCode: 'E9', firstName: 'ບຸນມີ', lastName: 'ພົມມະຈັນ', departmentId: 'd1' }, department: { nameLo: 'ການເງິນ', nameEn: 'Finance' } }], meta: { page: 1, pageSize: 20, total: 1 } }),
  );

describe('AttendancePage', () => {
  it('gives HR export and correction tools', async () => {
    server.use(...sessionHandlers(), listHandler(), http.get('/api/attendance/today', () => HttpResponse.json({ data: { date: '2026-11-03', isWorkingDay: true, onLeave: false, record: null } })), http.get('/api/departments', () => HttpResponse.json({ data: [], meta: { page: 1, pageSize: 100, total: 0 } })));
    renderApp(<AttendancePage />);
    expect(await screen.findByText('ບຸນມີ ພົມມະຈັນ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ສົ່ງອອກ CSV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ແກ້ໄຂ/ })).toBeInTheDocument();
  });

  it('shows an employee only their history, without export', async () => {
    server.use(...sessionHandlers(employeeMe()), listHandler(), http.get('/api/attendance/today', () => HttpResponse.json({ data: { date: '2026-11-03', isWorkingDay: true, onLeave: false, record: null } })));
    renderApp(<AttendancePage />);
    await waitFor(() => expect(screen.getByText('03/11/2026')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'ສົ່ງອອກ CSV' })).toBeNull();
    expect(screen.queryByRole('button', { name: /ແກ້ໄຂ/ })).toBeNull();
  });
});

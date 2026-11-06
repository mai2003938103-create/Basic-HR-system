import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeavePage } from './LeavePage';
import { renderApp } from '../../test/render';
import { employeeMe, http, HttpResponse, me, server, sessionHandlers } from '../../test/server';

const SICK = { id: 'lt-sick', code: 'SICK', nameLo: 'ລາປ່ວຍ', nameEn: 'Sick Leave', defaultDaysPerYear: 30, isPaid: true, documentRequiredAfterDays: 2, isActive: true };
const ANNUAL = { ...SICK, id: 'lt-annual', code: 'ANNUAL', nameLo: 'ລາພັກປະຈຳປີ', nameEn: 'Annual Leave', defaultDaysPerYear: 15, documentRequiredAfterDays: null };
const req = (over = {}) => ({
  id: 'r1', employee: { id: 'e5', firstName: 'ວັນນາ', lastName: 'ສີຫາລາດ', employeeCode: 'E5', departmentId: 'd1' }, leaveType: ANNUAL, startDate: '2026-11-10', endDate: '2026-11-12',
  halfDay: 'none', days: 3, reason: 'ພັກຜ່ອນ', documentUrl: null, status: 'pending', approver: null, decidedAt: null, decisionNote: null, createdAt: '2026-11-03T02:00:00Z', canApprove: false, canCancel: false, ...over,
});
const page = (rows: unknown[]) => HttpResponse.json({ data: rows, meta: { page: 1, pageSize: 20, total: rows.length } });

const base = (opts: { mine?: unknown[]; approvals?: unknown[]; all?: unknown[] } = {}) => [
  http.get('/api/leave-types', () => HttpResponse.json({ data: [ANNUAL, SICK] })),
  http.get('/api/holidays', () => HttpResponse.json({ data: [] })),
  http.get('/api/leave-balances', () =>
    HttpResponse.json({ data: [{ id: 'b1', employeeId: 'e1', year: 2026, leaveType: ANNUAL, entitledDays: 15, usedDays: 4, remainingDays: 11 }, { id: 'b2', employeeId: 'e1', year: 2026, leaveType: SICK, entitledDays: 30, usedDays: 0, remainingDays: 30 }] }),
  ),
  http.get('/api/leave-requests', ({ request }) => {
    const sp = new URL(request.url).searchParams;
    if (sp.get('mine') === 'true') return page(opts.mine ?? []);
    if (sp.get('toApprove') === 'true') return page(opts.approvals ?? []);
    return page(opts.all ?? []);
  }),
  http.get('/api/departments', () => page([])),
];

describe('LeavePage', () => {
  it('previews days, enforces the document rule and half-day rule', async () => {
    let posted = false;
    server.use(...sessionHandlers(employeeMe()), ...base(), http.post('/api/leave-requests', () => { posted = true; return HttpResponse.json({ data: req() }, { status: 201 }); }));
    renderApp(<LeavePage />);
    await userEvent.click(await screen.findByRole('button', { name: 'ຂໍລາພັກ' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox', { name: /ປະເພດການລາ/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'ລາປ່ວຍ' }));
    fireEvent.change(within(dialog).getByLabelText(/ວັນເລີ່ມ/), { target: { value: '2026-11-09' } });
    fireEvent.change(within(dialog).getByLabelText(/ວັນສິ້ນສຸດ/), { target: { value: '2026-11-09' } });
    expect(within(dialog).getByRole('combobox', { name: /ເຄິ່ງວັນ/ })).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/ວັນສິ້ນສຸດ/), { target: { value: '2026-11-13' } });
    expect(within(dialog).queryByRole('combobox', { name: /ເຄິ່ງວັນ/ })).toBeNull();
    expect(await within(dialog).findByText('ຈະນັບເປັນ 5 ວັນເຮັດວຽກ')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText(/ເຫດຜົນ/), 'ບໍ່ສະບາຍ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'ສົ່ງ' }));
    expect(await within(dialog).findByText('ກະລຸນາແນບເອກະສານຢັ້ງຢືນ')).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('lists approvals and requires a reason to reject', async () => {
    let rejectedWith = '';
    server.use(
      ...sessionHandlers(me({ roles: ['manager'], scope: 'department', permissions: ['leave.read', 'leave.request', 'leave.approve', 'dashboard.view'] })),
      ...base({ approvals: [req({ canApprove: true })] }),
      http.put('/api/leave-requests/r1/reject', async ({ request }) => {
        rejectedWith = ((await request.json()) as { note: string }).note;
        return HttpResponse.json({ data: req({ status: 'rejected' }) });
      }),
    );
    renderApp(<LeavePage />, { route: '/leave?tab=approvals' });
    expect(await screen.findByText('ວັນນາ ສີຫາລາດ')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'ປະຕິເສດ' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'ປະຕິເສດ' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByRole('textbox'), 'ຊ່ວງນີ້ວຽກຫຼາຍ');
    await userEvent.click(confirm);
    await waitFor(() => expect(rejectedWith).toBe('ຊ່ວງນີ້ວຽກຫຼາຍ'));
  });

  it('offers cancel only when allowed and shows balances', async () => {
    server.use(...sessionHandlers(employeeMe()), ...base({ mine: [req({ id: 'a', canCancel: true }), req({ id: 'b', status: 'approved', startDate: '2026-10-01', endDate: '2026-10-01', canCancel: false })] }));
    renderApp(<LeavePage />);
    await screen.findAllByText('ລາພັກປະຈຳປີ');
    expect(screen.getAllByRole('button', { name: 'ຍົກເລີກຄຳຮ້ອງ' })).toHaveLength(1);
    const balance = screen.getByTestId('balance-ANNUAL');
    expect(within(balance).getByText('11')).toBeInTheDocument();
  });

  it('shows admin tabs only with leave.manage', async () => {
    server.use(...sessionHandlers(employeeMe()), ...base());
    const { unmount } = renderApp(<LeavePage />);
    await screen.findByRole('heading', { name: 'ຄຳຮ້ອງຂອງຂ້ອຍ' }); // a single view shows a heading, not a tab strip
    expect(screen.queryByRole('tab', { name: 'ປະເພດການລາ' })).toBeNull();
    unmount();
    server.use(...sessionHandlers(me()), ...base());
    renderApp(<LeavePage />);
    expect(await screen.findByRole('tab', { name: 'ປະເພດການລາ' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'ວັນພັກລັດຖະການ' })).toBeInTheDocument();
    // approvers land on the approvals tab, ahead of their own requests
    expect(screen.getAllByRole('tab')[0]).toHaveTextContent('ລໍຖ້າອະນຸມັດ');
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
  });
});

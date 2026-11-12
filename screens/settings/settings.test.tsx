import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { renderApp } from '../../test/render';
import { http, HttpResponse, server, sessionHandlers } from '../../test/server';

const settings = {
  companyNameLo: 'ບໍລິສັດ', companyNameEn: 'Co', addressLo: null, addressEn: null, taxId: null, phone: null, email: null,
  currencyCode: 'LAK', currencySymbol: '₭', workingDays: [1, 2, 3, 4, 5], workStart: '08:00', workEnd: '17:00', breakStart: '12:00', breakEnd: '13:30',
  lateGraceMinutes: 15, halfDayMinutes: 240,
  // The nested shape the API really returns (company_settings.payroll_config).
  payroll: {
    payDay: 25, workDaysPerMonth: 22, hoursPerDay: 8, proration: 'workingDays', confirmedBy: null, confirmedAt: null,
    overtime: { weekdayRate: 150, restDayRate: 250, thresholdMinutes: 30, maxMinutesPerMonth: 2700 },
    socialSecurity: { employeeRate: 5.5, employerRate: 6, ceiling: 4500000 },
    incomeTax: { deductSocialSecurity: true, brackets: [{ upTo: 2500000, rate: 0 }, { upTo: null, rate: 5 }] },
  },
};

describe('SettingsPage payroll tab', () => {
  it('reads and saves the nested payroll rules, keeping fields it does not show', async () => {
    let body: any;
    server.use(
      ...sessionHandlers(),
      http.get('/api/settings', () => HttpResponse.json({ data: settings })),
      http.put('/api/settings/payroll', async ({ request }) => { body = await request.json(); return HttpResponse.json({ data: settings }); }),
    );
    renderApp(<SettingsPage />, { route: '/settings?tab=payroll' });
    const rest = await screen.findByLabelText('ອັດຕາໂອທີ ວັນພັກ (%)');
    expect(rest).toHaveValue(250);
    await userEvent.clear(rest);
    await userEvent.type(rest, '300');
    await userEvent.click(screen.getByRole('button', { name: 'ບັນທຶກ' }));
    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({
      hoursPerDay: 8, proration: 'workingDays',
      overtime: { weekdayRate: 150, restDayRate: 300, thresholdMinutes: 30, maxMinutesPerMonth: 2700 },
      socialSecurity: { employeeRate: 5.5, employerRate: 6, ceiling: 4500000 },
      incomeTax: { deductSocialSecurity: true, brackets: [{ upTo: 2500000, rate: 0 }, { upTo: null, rate: 5 }] },
    });
  });

  it('confirms unconfirmed rates after the accounting check is ticked', async () => {
    let confirmed = false;
    server.use(
      ...sessionHandlers(),
      http.get('/api/settings', () => HttpResponse.json({ data: settings })),
      http.post('/api/settings/payroll/confirm', () => { confirmed = true; return HttpResponse.json({ data: { ...settings, payroll: { ...settings.payroll, confirmedAt: '2026-11-11T08:00:00.000Z' } } }); }),
    );
    renderApp(<SettingsPage />, { route: '/settings?tab=payroll' });
    await userEvent.click(await screen.findByRole('button', { name: 'ຢືນຢັນອັດຕາ' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'ຢືນຢັນອັດຕາ' });
    expect(confirm).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('checkbox'));
    await userEvent.click(confirm);
    await waitFor(() => expect(confirmed).toBe(true));
    expect(await screen.findByText(/ອັດຕາຢືນຢັນແລ້ວ/)).toBeInTheDocument();
  });
});

describe('SettingsPage', () => {
  it('loads empty optional company fields without errors and saves only after a change', async () => {
    let saved: unknown;
    server.use(
      ...sessionHandlers(),
      http.get('/api/settings', () => HttpResponse.json({ data: settings })),
      http.put('/api/settings/company', async ({ request }) => { saved = await request.json(); return HttpResponse.json({ data: { ...settings, phone: '021' } }); }),
    );
    renderApp(<SettingsPage />);
    const save = await screen.findByRole('button', { name: 'ບັນທຶກ' });
    expect(save).toBeDisabled();
    expect(screen.getByText('ບໍ່ມີການແກ້ໄຂ')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('ເບີໂທ'), '021');
    expect(screen.getByText('ມີການແກ້ໄຂທີ່ຍັງບໍ່ໄດ້ບັນທຶກ')).toBeInTheDocument();
    await userEvent.click(save);
    await waitFor(() => expect(saved).toMatchObject({ phone: '021', addressLo: '' }));
    expect(await screen.findByText('ບໍ່ມີການແກ້ໄຂ')).toBeInTheDocument();
  });

  it('asks before leaving a tab with unsaved edits', async () => {
    server.use(...sessionHandlers(), http.get('/api/settings', () => HttpResponse.json({ data: settings })));
    renderApp(<SettingsPage />);
    await userEvent.type(await screen.findByLabelText('ເບີໂທ'), '9');
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'ເງິນເດືອນ ແລະ ອາກອນ' }));
    expect(await screen.findByRole('dialog', { name: 'ອອກໂດຍບໍ່ບັນທຶກ?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'ອອກໂດຍບໍ່ບັນທຶກ' }));
    expect(await screen.findByText(/ບັນທຶກທັງ 3 ພາກ/)).toBeInTheDocument();
  });
});

describe('ConfirmDialog acknowledge', () => {
  it('keeps confirm disabled until the statement is ticked', async () => {
    const onConfirm = vi.fn();
    renderApp(<ConfirmDialog open title="Pay?" confirmLabel="Mark paid" acknowledge="I have transferred" onConfirm={onConfirm} onOpenChange={() => undefined} />);
    const btn = await screen.findByRole('button', { name: 'Mark paid' });
    expect(btn).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(btn).toBeEnabled();
    await userEvent.click(btn);
    expect(onConfirm).toHaveBeenCalled();
  });
});

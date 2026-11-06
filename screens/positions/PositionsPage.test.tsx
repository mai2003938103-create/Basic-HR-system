import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PositionsPage } from './PositionsPage';
import { renderApp } from '../../test/render';
import { http, HttpResponse, server, sessionHandlers } from '../../test/server';

const d = { id: '11111111-1111-4111-8111-111111111111', code: 'FIN', nameLo: 'ການເງິນ', nameEn: 'Finance' };
describe('PositionsPage', () => {
  it('lists positions with their department and requires one on create', async () => {
    server.use(
      ...sessionHandlers(),
      http.get('/api/positions', () => HttpResponse.json({ data: [{ id: 'p1', code: 'ACC', nameLo: 'ບັນຊີ', nameEn: 'Accountant', description: null, isActive: true, department: d, employeeCount: 1 }], meta: { page: 1, pageSize: 20, total: 1 } })),
      http.get('/api/departments', () => HttpResponse.json({ data: [{ ...d, description: null, isActive: true, manager: null, employeeCount: 1 }], meta: { page: 1, pageSize: 100, total: 1 } })),
    );
    renderApp(<PositionsPage />);
    expect(await screen.findByText('ບັນຊີ')).toBeInTheDocument();
    expect(screen.getAllByText('ການເງິນ').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'ເພີ່ມຕຳແໜ່ງ' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'ບັນທຶກ' }));
    expect(await within(dialog).findByText('ກະລຸນາເລືອກພະແນກ')).toBeInTheDocument();
  });
});

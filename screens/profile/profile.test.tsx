import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePage } from './ProfilePage';
import { renderApp } from '../../test/render';
import { employeeMe, http, HttpResponse, server, sessionHandlers } from '../../test/server';

const employee = {
  id: 'e1', employeeCode: 'E1', firstName: 'ນາລີ', lastName: 'ວົງສະຫວັນ', gender: 'female', dateOfBirth: '1995-01-01', phone: '02055550001',
  email: 'emp@test.la', address: null, photoUrl: null, departmentId: 'd1', positionId: 'p1', hireDate: '2024-01-01', employmentStatus: 'active',
  emergencyContactName: null, emergencyContactPhone: null, emergencyContactRelation: null, basicSalary: '5000000.00',
  department: { nameLo: 'ບັນຊີ', nameEn: 'Accounting' }, position: { nameLo: 'ພະນັກງານ', nameEn: 'Officer' },
};

describe('ProfilePage personal details', () => {
  it('edits personal details in place and saves only what the employee may change', async () => {
    let body: any;
    server.use(
      ...sessionHandlers(employeeMe()),
      http.get('/api/employees/me', () => HttpResponse.json({ data: employee })),
      http.put('/api/employees/me', async ({ request }) => { body = await request.json(); return HttpResponse.json({ data: { ...employee, ...body } }); }),
    );
    renderApp(<ProfilePage />);
    const save = await screen.findByRole('button', { name: 'ບັນທຶກ' });
    expect(save).toBeDisabled();
    expect(screen.getByLabelText(/ອີເມວ/)).toBeDisabled();
    // Employment details are no longer shown on the profile.
    expect(screen.queryByText('ຂໍ້ມູນການເຮັດວຽກ')).not.toBeInTheDocument();

    const first = screen.getByRole('textbox', { name: /^ຊື່\s*\*?$/ });
    await userEvent.clear(first);
    await userEvent.type(first, 'ມາລີ');
    await userEvent.type(screen.getByLabelText('ທີ່ຢູ່'), 'ບ້ານໂພນໄຊ');
    expect(screen.getByText('ມີການແກ້ໄຂທີ່ຍັງບໍ່ໄດ້ບັນທຶກ')).toBeInTheDocument();
    await userEvent.click(save);
    await waitFor(() => expect(body).toMatchObject({ firstName: 'ມາລີ', lastName: 'ວົງສະຫວັນ', gender: 'female', dateOfBirth: '1995-01-01', address: 'ບ້ານໂພນໄຊ' }));
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('basicSalary');
    expect(await screen.findByText('ບໍ່ມີການແກ້ໄຂ')).toBeInTheDocument();
  });

  it('shows the server field error next to the field', async () => {
    server.use(
      ...sessionHandlers(employeeMe()),
      http.get('/api/employees/me', () => HttpResponse.json({ data: employee })),
      http.put('/api/employees/me', () => HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'errors.validation.invalid', details: [{ field: 'phone', message: 'errors.validation.phone' }] } }, { status: 400 })),
    );
    renderApp(<ProfilePage />);
    const phone = await screen.findByLabelText(/ເບີໂທລະສັບ/);
    await userEvent.type(phone, 'x');
    await userEvent.click(screen.getByRole('button', { name: 'ບັນທຶກ' }));
    expect(await screen.findByText('ເບີໂທບໍ່ຖືກຕ້ອງ')).toBeInTheDocument();
  });
});

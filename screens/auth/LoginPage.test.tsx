import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
import { renderApp } from '../../test/render';
import { navigation } from '../../test/navigation';
import { anonymousHandlers, employeeMe, http, HttpResponse, me, server, sessionHandlers } from '../../test/server';

const routes = [
  { path: '/', element: <div>HOME</div> },
  { path: '/attendance', element: <div>ATTENDANCE</div> },
];

describe('LoginPage', () => {
  it('shows a translated error for bad credentials', async () => {
    server.use(...anonymousHandlers(), http.post('/api/auth/login', () => HttpResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'errors.auth.invalidCredentials' } }, { status: 401 })));
    renderApp(<LoginPage />, { route: '/login', path: '/login', routes });
    await userEvent.type(await screen.findByLabelText('ອີເມວ'), 'x@test.la');
    await userEvent.type(screen.getByLabelText('ລະຫັດຜ່ານ'), 'Wrong1234');
    await userEvent.click(screen.getByRole('button', { name: 'ເຂົ້າສູ່ລະບົບ' }));
    expect(await screen.findByText('ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ')).toBeInTheDocument();
  });

  it('validates empty fields without calling the server', async () => {
    let called = false;
    server.use(...anonymousHandlers(), http.post('/api/auth/login', () => { called = true; return HttpResponse.json({}); }));
    renderApp(<LoginPage />, { route: '/login', path: '/login', routes });
    await userEvent.click(await screen.findByRole('button', { name: 'ເຂົ້າສູ່ລະບົບ' }));
    expect((await screen.findAllByText('ກະລຸນາປ້ອນຂໍ້ມູນນີ້')).length).toBeGreaterThan(0);
    expect(called).toBe(false);
  });

  it('sends HR to the dashboard after sign-in', async () => {
    server.use(...anonymousHandlers(), http.post('/api/auth/login', () => HttpResponse.json({ data: { accessToken: 't', user: me() } })));
    renderApp(<LoginPage />, { route: '/login', path: '/login', routes });
    await userEvent.type(await screen.findByLabelText('ອີເມວ'), 'hr@test.la');
    await userEvent.type(screen.getByLabelText('ລະຫັດຜ່ານ'), 'Passw0rd1');
    await userEvent.click(screen.getByRole('button', { name: 'ເຂົ້າສູ່ລະບົບ' }));
    await waitFor(() => expect(screen.getByText('HOME')).toBeInTheDocument());
  });

  it('sends an employee to attendance after sign-in', async () => {
    server.use(...anonymousHandlers(), http.post('/api/auth/login', () => HttpResponse.json({ data: { accessToken: 't', user: employeeMe() } })));
    renderApp(<LoginPage />, { route: '/login', path: '/login', routes });
    await userEvent.type(await screen.findByLabelText('ອີເມວ'), 'emp@test.la');
    await userEvent.type(screen.getByLabelText('ລະຫັດຜ່ານ'), 'Passw0rd1');
    await userEvent.click(screen.getByRole('button', { name: 'ເຂົ້າສູ່ລະບົບ' }));
    await waitFor(() => expect(screen.getByText('ATTENDANCE')).toBeInTheDocument());
  });

  it('ignores a ?from= that points to another site (open redirect)', async () => {
    server.use(...sessionHandlers(me()));
    renderApp(<LoginPage />, { route: '/login?from=/%5Cevil.com', path: '/login', routes });
    await waitFor(() => expect(navigation.pathname).not.toBe('/login'));
    expect(navigation.href).toBe('http://localhost/');
  });
});

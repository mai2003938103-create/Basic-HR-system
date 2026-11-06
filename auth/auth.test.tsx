import { screen, waitFor } from '@testing-library/react';
import { api, setAccessToken } from '../lib/api';
import { useAuth } from './useAuth';
import { renderApp } from '../test/render';
import { employeeMe, http, HttpResponse, server, sessionHandlers } from '../test/server';

function Probe() {
  const { status, can, user } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email}</span>
      <span data-testid="can">{String(can('employee.create'))}</span>
    </div>
  );
}

describe('auth', () => {
  it('restores the session from the refresh cookie and checks permissions', async () => {
    server.use(...sessionHandlers(employeeMe()));
    renderApp(<Probe />);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('email')).toHaveTextContent('emp@test.la');
    expect(screen.getByTestId('can')).toHaveTextContent('false');
  });

  it('refreshes once for parallel 401 responses and retries', async () => {
    let refreshCalls = 0;
    let valid = 'old';
    server.use(
      http.post('/api/auth/refresh', () => {
        refreshCalls++;
        valid = 'new';
        return HttpResponse.json({ data: { accessToken: 'new', user: employeeMe() } });
      }),
      http.get('/api/thing', ({ request }) =>
        request.headers.get('authorization') === `Bearer ${valid}` && valid === 'new'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'x' } }, { status: 401 }),
      ),
    );
    setAccessToken('old');
    const [a, b] = await Promise.all([api.get('/thing'), api.get('/thing')]);
    expect(a.data.ok && b.data.ok).toBe(true);
    expect(refreshCalls).toBe(1);
  });
});

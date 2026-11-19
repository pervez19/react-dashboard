import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppProviders } from '../../core/providers/AppProviders';
import { routes } from '../../routes';
import { apiClient } from '../../core/services/apiService';
import { setupAuthInterceptor } from '../../core/interceptors/authInterceptor';
import { setupErrorInterceptor } from '../../core/interceptors/errorInterceptor';
import { notificationService } from '../../core/services/notificationService';
import { API_URLS } from '../../core/constants/apiUrls';
import { Role } from '../../core/enums/RoleEnum';
import { makeStore } from '../../store';
import { loginBody, makeUser, mockApi, type MockHandler } from '../../setupTests';

/** Integration: real store, providers, guards, interceptors and routes; only HTTP is faked. */
function renderApp(path: string, handler: MockHandler) {
  const calls = mockApi(handler);
  const store = makeStore();
  const ejectAuth = setupAuthInterceptor(apiClient, store);
  const ejectError = setupErrorInterceptor(apiClient);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders store={store}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { calls, store, router, cleanup: () => (ejectAuth(), ejectError()) };
}

async function signInViaForm(email: string) {
  await userEvent.type(await screen.findByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/password/i), 'Secret123');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

const onlyAuthCalls = (calls: { url?: string }[]) =>
  calls.every((c) => Object.values(API_URLS.AUTH).includes(c.url as never));

describe('App (integration)', () => {
  let cleanup = () => {};
  beforeEach(() => notificationService.clear());
  afterEach(() => cleanup());

  it('keeps the user signed in across a page reload (session restored from the stored refresh token)', async () => {
    sessionStorage.setItem('auth.refreshToken', 'rt-from-before-reload');
    const app = renderApp('/dashboard', (c) =>
      c.url === API_URLS.AUTH.REFRESH ? { status: 200, data: loginBody('restored') } : { status: 404 },
    );
    cleanup = app.cleanup;

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument(); // no protected flash
    expect(await screen.findByText('Hello, Ada Lovelace')).toBeInTheDocument();
    expect(app.store.getState().auth.accessToken).toBe('restored');
    const refreshCalls = app.calls.filter((c) => c.url === API_URLS.AUTH.REFRESH);
    expect(refreshCalls).toHaveLength(1);
    expect(JSON.parse(refreshCalls[0]!.data as string)).toEqual({ refreshToken: 'rt-from-before-reload' });
    expect(sessionStorage.getItem('auth.refreshToken')).toBe('rt-for-restored'); // rotated
    expect(Object.values({ ...sessionStorage })).not.toContain('restored'); // access token is never stored
  });

  it('without a stored session, redirects to login, then back to the requested page after signing in', async () => {
    const user = makeUser();
    const app = renderApp('/dashboard', (c) => {
      if (c.url === API_URLS.AUTH.REFRESH) return { status: 401 };
      if (c.url === API_URLS.AUTH.LOGIN) return { status: 200, data: loginBody('at', user) };
      return { status: 404 };
    });
    cleanup = app.cleanup;

    await signInViaForm(user.email);

    expect(await screen.findByText('Hello, Ada Lovelace')).toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe('/dashboard');
    expect(app.calls.some((c) => c.url === API_URLS.AUTH.REFRESH)).toBe(false); // nothing to restore
    expect(sessionStorage.getItem('auth.refreshToken')).toBe('rt-for-at');
  });

  it('shows static dashboard data without calling any report API', async () => {
    sessionStorage.setItem('auth.refreshToken', 'rt');
    const app = renderApp('/dashboard', (c) =>
      c.url === API_URLS.AUTH.REFRESH ? { status: 200, data: loginBody('at') } : { status: 404 },
    );
    cleanup = app.cleanup;

    expect(await screen.findByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('1,284')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
    expect(onlyAuthCalls(app.calls)).toBe(true);
  });

  it('validates the login form before calling the API', async () => {
    const app = renderApp('/login', () => ({ status: 401 }));
    cleanup = app.cleanup;

    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(app.calls.some((c) => c.url === API_URLS.AUTH.LOGIN)).toBe(false);
  });

  it('shows an inline error for wrong credentials', async () => {
    cleanup = renderApp('/login', () => ({ status: 401 })).cleanup;
    await userEvent.type(await screen.findByLabelText(/email/i), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('sends non-admins away from the admin page', async () => {
    sessionStorage.setItem('auth.refreshToken', 'rt');
    const app = renderApp('/dashboard/admin', (c) =>
      c.url === API_URLS.AUTH.REFRESH
        ? { status: 200, data: loginBody('at', makeUser({ roles: [Role.USER] })) }
        : { status: 404 },
    );
    cleanup = app.cleanup;
    expect(await screen.findByText('Access denied')).toBeInTheDocument();
  });

  it('sign out revokes the session on the server and returns to the login page', async () => {
    sessionStorage.setItem('auth.refreshToken', 'rt');
    const app = renderApp('/dashboard', (c) => {
      if (c.url === API_URLS.AUTH.REFRESH) return { status: 200, data: loginBody('at') };
      if (c.url === API_URLS.AUTH.LOGOUT) return { status: 200, data: { status: 'success', data: null } };
      return { status: 404 };
    });
    cleanup = app.cleanup;

    await userEvent.click(await screen.findByRole('button', { name: 'Account menu' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe('/login');
    const logoutCall = app.calls.find((c) => c.url === API_URLS.AUTH.LOGOUT);
    expect(logoutCall?.headers.get('Authorization')).toBe('Bearer at');
    expect(JSON.parse(logoutCall?.data as string)).toEqual({ refreshToken: 'rt-for-at' });
    expect(sessionStorage.getItem('auth.refreshToken')).toBeNull();
  });
});

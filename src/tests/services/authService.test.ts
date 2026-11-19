import { authService, refreshTokenStore } from '../../core/services/authService';
import { API_URLS } from '../../core/constants/apiUrls';
import { Role } from '../../core/enums/RoleEnum';
import { ApiError } from '../../core/interceptors/errorInterceptor';
import { delay, loginBody, makeUser, mockApi } from '../../setupTests';

const body = (c: { data?: unknown }) => (c.data ? JSON.parse(c.data as string) : undefined);

describe('authService', () => {
  const user = makeUser({ roles: [Role.ADMIN], permissions: ['user:read'] });

  it('login unwraps the envelope, maps the user and stores only the refresh token', async () => {
    const calls = mockApi(() => ({ status: 200, data: loginBody('at', user, 'rt-1') }));
    await expect(authService.login({ email: user.email, password: 'pw' })).resolves.toEqual({ accessToken: 'at', user });
    expect(calls[0]).toMatchObject({ url: API_URLS.AUTH.LOGIN, method: 'post', skipAuthRefresh: true });
    expect(body(calls[0]!)).toEqual({ email: user.email, password: 'pw' });
    expect(refreshTokenStore.get()).toBe('rt-1');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('"at"'); // access token never persisted
    expect(localStorage.length).toBe(0);
  });

  it('maps Spring authorities to roles and drops unknown ones', async () => {
    const raw = loginBody('at', user);
    raw.data.roles = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_ROOT', 'USER'];
    mockApi(() => ({ status: 200, data: raw }));
    const { user: parsed } = await authService.login({ email: user.email, password: 'pw' });
    expect(parsed.roles).toEqual([Role.ADMIN, Role.MANAGER, Role.USER]);
  });

  it.each([
    ['a non-success envelope', { status: 'error', message: 'Bad credentials', data: null }],
    ['a missing token', { ...loginBody(), data: { ...loginBody().data, token: '' } }],
    ['a missing refresh token', { ...loginBody(), data: { ...loginBody().data, refreshToken: undefined } }],
    ['a missing uuid', { ...loginBody(), data: { ...loginBody().data, uuid: undefined } }],
  ])('login rejects %s and stores nothing', async (_case, data) => {
    mockApi(() => ({ status: 200, data }));
    await expect(authService.login({ email: 'a@b.co', password: 'pw' })).rejects.toBeInstanceOf(ApiError);
    expect(refreshTokenStore.get()).toBeNull();
  });

  it('refresh sends the stored token and stores the rotated one', async () => {
    refreshTokenStore.set('rt1');
    const calls = mockApi((c) => {
      const sent = body(c).refreshToken as string;
      return { status: 200, data: loginBody(`at-after-${sent}`, user, `${sent}-next`) };
    });
    await expect(authService.refreshAccessToken()).resolves.toEqual({ accessToken: 'at-after-rt1', user });
    await expect(authService.refreshAccessToken()).resolves.toMatchObject({ accessToken: 'at-after-rt1-next' });
    expect(calls.map(body)).toEqual([{ refreshToken: 'rt1' }, { refreshToken: 'rt1-next' }]);
    expect(refreshTokenStore.get()).toBe('rt1-next-next');
  });

  it('refresh is single-flight: concurrent callers share one request (rotation-safe)', async () => {
    refreshTokenStore.set('rt');
    const calls = mockApi(async () => {
      await delay(10);
      return { status: 200, data: loginBody('new', user) };
    });
    const results = await Promise.all([authService.refreshAccessToken(), authService.refreshAccessToken()]);
    expect(calls).toHaveLength(1);
    expect(results[0]).toBe(results[1]);
  });

  it('refresh without a stored token fails fast, without a network call', async () => {
    const calls = mockApi(() => ({ status: 200, data: loginBody() }));
    await expect(authService.refreshAccessToken()).rejects.toMatchObject({ status: 401, code: 'NO_REFRESH_TOKEN' });
    expect(calls).toHaveLength(0);
  });

  it('a rejected refresh removes the stored token', async () => {
    refreshTokenStore.set('revoked');
    mockApi(() => ({ status: 401 }));
    await expect(authService.refreshAccessToken()).rejects.toBeDefined();
    expect(refreshTokenStore.get()).toBeNull();
  });

  it('logout sends the refresh token for revocation and removes it locally', async () => {
    refreshTokenStore.set('rt-x');
    const calls = mockApi(() => ({ status: 200, data: { status: 'success', message: 'Logout Successful', data: null } }));
    await authService.logout();
    expect(calls[0]).toMatchObject({ url: API_URLS.AUTH.LOGOUT, method: 'post' });
    expect(body(calls[0]!)).toEqual({ refreshToken: 'rt-x' });
    expect(refreshTokenStore.get()).toBeNull();
  });

  it('logout removes the local token even when the server call fails', async () => {
    refreshTokenStore.set('rt-x');
    mockApi(() => ({ status: 500 }));
    await expect(authService.logout()).rejects.toBeDefined();
    expect(refreshTokenStore.get()).toBeNull();
  });

  it('checkAuthentication restores the session after a page reload', async () => {
    refreshTokenStore.set('rt');
    mockApi(() => ({ status: 200, data: loginBody('restored', user) }));
    await expect(authService.checkAuthentication()).resolves.toEqual({ accessToken: 'restored', user });
  });

  it('checkAuthentication returns null when nothing is stored', async () => {
    await expect(authService.checkAuthentication()).resolves.toBeNull();
  });
});

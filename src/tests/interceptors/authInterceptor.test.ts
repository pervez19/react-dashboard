import { apiClient, isOwnApiRequest } from '../../core/services/apiService';
import { setupAuthInterceptor } from '../../core/interceptors/authInterceptor';
import { ApiError, setupErrorInterceptor } from '../../core/interceptors/errorInterceptor';
import { notificationService } from '../../core/services/notificationService';
import { API_URLS } from '../../core/constants/apiUrls';
import { GATEWAY_KEY_HEADER } from '../../core/constants/appConstants';
import { NotificationType } from '../../core/enums/NotificationTypeEnum';
import { tokenRefreshed } from '../../store/authStore';
import { delay, loginBody, makeJwt, mockApi, signInStore, storeWithSession } from '../../setupTests';
import type { AppStore } from '../../store';

const auth = (c: { headers: { get(name: string): unknown } }) => c.headers.get('Authorization');

describe('authInterceptor', () => {
  let store: AppStore;
  let eject: () => void;

  const signIn = async (accessToken = 'old') => {
    store = storeWithSession();
    await signInStore(store, accessToken); // real login, so authService holds a refresh token
    const ejectAuth = setupAuthInterceptor(apiClient, store);
    const ejectError = setupErrorInterceptor(apiClient);
    eject = () => {
      ejectAuth();
      ejectError();
    };
  };

  beforeEach(() => notificationService.clear());
  afterEach(() => eject());

  it('attaches the in-memory token as a Bearer header', async () => {
    await signIn('abc');
    const calls = mockApi(() => ({ status: 200 }));
    await apiClient.get('/things');
    expect(auth(calls[0]!)).toBe('Bearer abc');
  });

  it('never sends the token to another origin', async () => {
    await signIn('abc');
    const calls = mockApi(() => ({ status: 200 }));
    await apiClient.get('https://evil.example.com/steal');
    expect(auth(calls[0]!)).toBeUndefined();
  });

  it('sends the gateway API key on every request, including auth endpoints and retries', async () => {
    await signIn('old');
    const calls = mockApi((c) => {
      if (c.url === API_URLS.AUTH.REFRESH) return { status: 200, data: loginBody('new') };
      return auth(c) === 'Bearer new' ? { status: 200 } : { status: 401 };
    });
    await apiClient.get('/things'); // 401 → refresh → retry
    expect(calls).toHaveLength(3);
    calls.forEach((c) => expect(c.headers.get(GATEWAY_KEY_HEADER)).toBe('test-gateway-key'));
  });

  it('isOwnApiRequest (also gates the CSRF header) only accepts our API', () => {
    const baseURL = 'http://api.test';
    expect(isOwnApiRequest({ url: '/auth/refresh', baseURL })).toBe(true);
    expect(isOwnApiRequest({ url: 'http://api.test/x', baseURL })).toBe(true);
    expect(isOwnApiRequest({ url: 'https://evil.example.com/x', baseURL })).toBe(false);
    expect(isOwnApiRequest({ url: '//evil.example.com/x', baseURL })).toBe(false);
    expect(isOwnApiRequest({ url: 'http://api.test.evil.com/x', baseURL })).toBe(false);
    expect(isOwnApiRequest({ url: 'http://api.test@evil.com/x', baseURL })).toBe(false);
  });

  it('on 401 refreshes once and retries the original request with the new token', async () => {
    await signIn('old');
    const calls = mockApi((c) => {
      if (c.url === API_URLS.AUTH.REFRESH) return { status: 200, data: loginBody('new') };
      return auth(c) === 'Bearer new' ? { status: 200, data: 'ok' } : { status: 401 };
    });

    const res = await apiClient.get('/things');
    expect(res.data).toBe('ok');
    expect(calls.map((c) => c.url)).toEqual(['/things', API_URLS.AUTH.REFRESH, '/things']);
    expect(store.getState().auth.accessToken).toBe('new');
  });

  it('concurrent 401s share ONE refresh, then every request is retried', async () => {
    await signIn('old');
    let refreshCalls = 0;
    mockApi(async (c) => {
      if (c.url === API_URLS.AUTH.REFRESH) {
        refreshCalls++;
        await delay(20);
        return { status: 200, data: loginBody('new') };
      }
      return auth(c) === 'Bearer new' ? { status: 200, data: c.url } : { status: 401 };
    });

    const results = await Promise.all(['/a', '/b', '/c', '/d'].map((u) => apiClient.get(u)));
    expect(refreshCalls).toBe(1);
    expect(results.map((r) => r.data)).toEqual(['/a', '/b', '/c', '/d']);
  });

  it('when refresh fails: rejects all queued requests, clears auth, shows ONE session-expired notice', async () => {
    await signIn('old');
    let refreshCalls = 0;
    mockApi(async (c) => {
      if (c.url === API_URLS.AUTH.REFRESH) {
        refreshCalls++;
        await delay(10);
        return { status: 401 };
      }
      return { status: 401 };
    });

    const results = await Promise.allSettled(['/a', '/b', '/c'].map((u) => apiClient.get(u)));
    expect(refreshCalls).toBe(1);
    results.forEach((r) => {
      expect(r.status).toBe('rejected');
      expect((r as PromiseRejectedResult).reason).toMatchObject({ status: 401 });
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(ApiError);
    });
    expect(store.getState().auth).toMatchObject({ isAuthenticated: false, accessToken: null, user: null });
    expect(notificationService.getSnapshot()).toEqual([
      expect.objectContaining({ type: NotificationType.WARNING, message: expect.stringMatching(/session has expired/i) }),
    ]);
  });

  it('does not loop: a retried request that 401s again is rejected without another refresh', async () => {
    await signIn('old');
    let refreshCalls = 0;
    mockApi((c) => {
      if (c.url === API_URLS.AUTH.REFRESH) {
        refreshCalls++;
        return { status: 200, data: loginBody('new') };
      }
      return { status: 401 };
    });

    await expect(apiClient.get('/forbidden-forever')).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls).toBe(1);
  });

  it('never refreshes for requests flagged skipAuthRefresh (e.g. the refresh endpoint itself)', async () => {
    await signIn('old');
    const calls = mockApi(() => ({ status: 401 }));
    await expect(apiClient.post(API_URLS.AUTH.REFRESH, undefined, { skipAuthRefresh: true })).rejects.toMatchObject({
      status: 401,
    });
    expect(calls).toHaveLength(1);
  });

  it('does not refresh when nobody is signed in', async () => {
    store = storeWithSession(null);
    eject = setupAuthInterceptor(apiClient, store);
    const calls = mockApi(() => ({ status: 401 }));
    await expect(apiClient.get('/things')).rejects.toBeDefined();
    expect(calls).toHaveLength(1);
  });

  it('retries without refreshing when another request already rotated the token', async () => {
    await signIn('old');
    const calls = mockApi((c) => {
      if (auth(c) === 'Bearer old') {
        store.dispatch(tokenRefreshed({ accessToken: 'new' })); // refresh completed while we were in flight
        return { status: 401 };
      }
      return { status: 200 };
    });
    await apiClient.get('/things');
    expect(calls.map((c) => c.url)).toEqual(['/things', '/things']);
    expect(auth(calls[1]!)).toBe('Bearer new');
  });

  it('refreshes proactively before sending an already-expired JWT', async () => {
    await signIn(makeJwt(-10));
    const fresh = makeJwt(900);
    const calls = mockApi((c) =>
      c.url === API_URLS.AUTH.REFRESH ? { status: 200, data: loginBody(fresh) } : { status: 200 },
    );
    await apiClient.get('/things');
    expect(calls.map((c) => c.url)).toEqual([API_URLS.AUTH.REFRESH, '/things']);
    expect(auth(calls[1]!)).toBe(`Bearer ${fresh}`);
  });
});

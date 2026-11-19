import { AxiosError } from 'axios';
import { apiClient } from '../../core/services/apiService';
import { ApiError, normalizeApiError, setupErrorInterceptor } from '../../core/interceptors/errorInterceptor';
import { notificationService } from '../../core/services/notificationService';
import { mockApi } from '../../setupTests';

describe('errorInterceptor', () => {
  let eject: () => void;
  beforeEach(() => {
    notificationService.clear();
    eject = setupErrorInterceptor(apiClient);
  });
  afterEach(() => eject());

  const fail = async (status: number, data?: unknown, headers?: Record<string, string>) => {
    mockApi(() => ({ status, data, headers }));
    return apiClient.get('/x').then(
      () => {
        throw new Error('expected failure');
      },
      (e: unknown) => e as ApiError,
    );
  };

  it.each([
    [400, { message: 'Name is too long' }, 'Name is too long'],
    [403, { message: 'internal policy id 42' }, 'You do not have permission to perform this action.'],
    [404, undefined, 'The requested resource was not found.'],
    [409, { message: 'Email already registered' }, 'Email already registered'],
    [500, { message: 'NullPointerException at Foo.java:12' }, 'Something went wrong on our side. Please try again later.'],
    [503, undefined, 'Something went wrong on our side. Please try again later.'],
  ])('normalises HTTP %i without leaking server internals', async (status, body, message) => {
    const error = await fail(status, body);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status, message });
    expect(notificationService.getSnapshot()[0]?.message).toBe(message);
  });

  it('maps 422 field errors', async () => {
    const error = await fail(422, { errors: { email: ['Invalid email'], name: 'Required' } });
    expect(error.fieldErrors).toEqual({ email: 'Invalid email', name: 'Required' });
  });

  it('uses Retry-After for 429', async () => {
    const error = await fail(429, undefined, { 'retry-after': '30' });
    expect(error.message).toBe('Too many requests. Please try again in 30 seconds.');
  });

  it('leaves 401 to the auth layer (no toast)', async () => {
    await fail(401);
    expect(notificationService.getSnapshot()).toHaveLength(0);
  });

  it('respects skipErrorNotification', async () => {
    mockApi(() => ({ status: 500 }));
    await expect(apiClient.get('/x', { skipErrorNotification: true })).rejects.toBeInstanceOf(ApiError);
    expect(notificationService.getSnapshot()).toHaveLength(0);
  });

  it('shows one notification for many identical failures', async () => {
    mockApi(() => ({ status: 500 }));
    await Promise.allSettled([apiClient.get('/a'), apiClient.get('/b'), apiClient.get('/c')]);
    expect(notificationService.getSnapshot()).toHaveLength(1);
  });

  it('normalises network errors and timeouts', () => {
    expect(normalizeApiError(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toMatchObject({ status: 0, code: 'NETWORK' });
    expect(normalizeApiError(new AxiosError('timeout', AxiosError.ECONNABORTED))).toMatchObject({ code: 'TIMEOUT' });
    expect(normalizeApiError(new Error('boom'))).toMatchObject({ code: 'UNKNOWN' });
  });
});

// Shared test utilities (environment setup lives in /jest.setup.ts).
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './core/services/apiService';
import { authService } from './core/services/authService';
import { Role } from './core/enums/RoleEnum';
import { initializeAuth } from './store/authStore';
import { makeStore, type AppStore } from './store';
import type { User } from './core/models/User';

export interface MockReply {
  status: number;
  data?: unknown;
  headers?: Record<string, string>;
}
export type MockHandler = (config: InternalAxiosRequestConfig) => MockReply | Promise<MockReply>;

/**
 * Replaces the HTTP adapter of the real apiClient, so interceptors run exactly as in production.
 * Returns the list of requests the "server" received.
 */
export function mockApi(handler: MockHandler): InternalAxiosRequestConfig[] {
  const calls: InternalAxiosRequestConfig[] = [];
  apiClient.defaults.adapter = async (config) => {
    calls.push(config);
    const { status, data, headers = {} } = await handler(config);
    const response: AxiosResponse = { status, data, statusText: String(status), headers, config, request: {} };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(
      `Request failed with status code ${status}`,
      status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      response,
    );
  };
  return calls;
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  accountId: 'acc-1',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  roles: [Role.USER],
  permissions: [],
  ...overrides,
});

/** Exactly what /signin and /refresh-token return (envelope + LoginResponseDTO, Spring "ROLE_" authorities). */
export const loginBody = (accessToken = 'at', user: User = makeUser(), refreshToken = `rt-for-${accessToken}`) => ({
  status: 'success',
  message: 'Login Successful',
  data: {
    uuid: user.id,
    accountId: user.accountId,
    name: user.name,
    email: user.email,
    token: accessToken,
    tokenDuration: 3600000,
    refreshToken,
    refreshTokenDuration: 7200000,
    roles: user.roles.map((r) => `ROLE_${r}`),
    permissions: user.permissions,
  },
});

/** Signs in through the real authService (so it holds a refresh token) and loads the session into the store. */
export async function signInStore(store: AppStore, accessToken = 'at', user: User = makeUser()): Promise<void> {
  mockApi(() => ({ status: 200, data: loginBody(accessToken, user) }));
  const session = await authService.login({ email: user.email, password: 'pw' });
  store.dispatch(initializeAuth.fulfilled(session, 'test'));
}

// UTF-8 then base64url, like a real JWT encoder.
const b64url = (value: object) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Unsigned test JWT; `expInSeconds` is relative to now. */
export const makeJwt = (expInSeconds: number, claims: object = {}) =>
  `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + expInSeconds, ...claims })}.sig`;

/** A store in a known auth state: `null` = initialised and signed out; omitted = still initialising. */
export function storeWithSession(session?: { accessToken: string; user: User } | null): AppStore {
  const store = makeStore();
  if (session !== undefined) store.dispatch(initializeAuth.fulfilled(session, 'test'));
  return store;
}

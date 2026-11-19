import { apiService } from './apiService';
import { API_URLS } from '../constants/apiUrls';
import { isRole, type Role } from '../enums/RoleEnum';
import { ApiError } from '../interceptors/errorInterceptor';
import { isNonEmptyString } from '../utils/commonUtils';
import type { User } from '../models/User';
import type { AuthSession, LoginRequest, RefreshResponse, RegisterRequest } from '../models/Token';

// Auth endpoints never trigger a refresh themselves (prevents refresh loops) and report errors to the caller.
const AUTH_CALL = { skipAuthRefresh: true, skipErrorNotification: true } as const;

/** Every backend response: `{ status: "success" | ..., message, data }`. */
interface ApiEnvelope {
  status?: unknown;
  message?: unknown;
  data?: unknown;
}

/** `data` of /signin and /refresh-token (LoginResponseDTO). */
interface RawLoginData {
  uuid?: unknown;
  accountId?: unknown;
  name?: unknown;
  email?: unknown;
  token?: unknown;
  refreshToken?: unknown;
    roles?: unknown;
  permissions?: unknown;
}

const invalid = (what: string) => new ApiError(`Received an invalid ${what}.`, 0, 'INVALID_RESPONSE');

function unwrap(body: unknown): unknown {
  const envelope = body as ApiEnvelope | null;
  if (!envelope || typeof envelope !== 'object' || envelope.status !== 'success') {
    const message = isNonEmptyString(envelope?.message) ? envelope.message : 'The request was not successful.';
    throw new ApiError(message, 0, 'UNSUCCESSFUL_RESPONSE');
  }
  return envelope.data;
}

const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

/** Spring authorities ("ROLE_ADMIN") → app roles (Role.ADMIN). Unknown roles are dropped. */
const toRoles = (value: unknown): Role[] => toStringList(value).map((r) => r.replace(/^ROLE_/, '')).filter(isRole);

// Trust boundary: validate what the server returns before it reaches app state.
function parseLoginData(body: unknown): { session: AuthSession; refreshToken: string } {
  const d = unwrap(body) as RawLoginData | null;
  if (!d || !isNonEmptyString(d.uuid) || !isNonEmptyString(d.email)) throw invalid('user profile');
  if (!isNonEmptyString(d.token)) throw invalid('access token');
  if (!isNonEmptyString(d.refreshToken)) throw invalid('refresh token');

  const user: User = {
    id: d.uuid,
    accountId: isNonEmptyString(d.accountId) ? d.accountId : undefined,
    email: d.email,
    name: isNonEmptyString(d.name) ? d.name : d.email,
    roles: toRoles(d.roles),
    permissions: toStringList(d.permissions),
  };
  return { session: { accessToken: d.token, user }, refreshToken: d.refreshToken };
}

/**
 * The backend returns the refresh token in the response body, so the frontend has to keep it. It goes in
 * sessionStorage: it survives a page reload but is gone when the tab/browser closes, and it is never sent
 * anywhere except /refresh-token and /logout. The access token itself stays in memory (Redux) only.
 * shortcut: script injected into the page (XSS) can read sessionStorage; if the backend ever sets the
 * refresh token as an HttpOnly cookie, delete this store and let the browser send the cookie.
 */
const REFRESH_TOKEN_KEY = 'auth.refreshToken';
export const refreshTokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null; // storage disabled (e.g. strict privacy mode): behaves like "no session"
    }
  },
  set(token: string): void {
    try {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // Can't persist: the session still works until the next reload.
    }
  },
  clear(): void {
    try {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // nothing stored
    }
  },
};

let refreshInFlight: Promise<RefreshResponse> | null = null;

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthSession> {
    const { session, refreshToken } = parseLoginData(
      await apiService.post<unknown>(API_URLS.AUTH.LOGIN, credentials, AUTH_CALL),
    );
    refreshTokenStore.set(refreshToken);
    return session;
  },

  /** Creates an account. The user signs in afterwards (no auto-login, no email verification). */
  async register(request: RegisterRequest): Promise<void> {
    unwrap(await apiService.post<unknown>(API_URLS.AUTH.REGISTER, request, AUTH_CALL));
  },

  /**
   * Revokes the access token (sent by the auth interceptor) and the refresh token on the server.
   * The stored refresh token is removed first, so the user stays signed out even if the call fails.
   */
  async logout(): Promise<void> {
    const refreshToken = refreshTokenStore.get();
    refreshTokenStore.clear();
    await apiService.post<unknown>(API_URLS.AUTH.LOGOUT, refreshToken ? { refreshToken } : undefined, AUTH_CALL);
  },

  /**
   * Sends the stored refresh token and stores the rotated one the backend returns.
   * Single-flight: every concurrent caller (startup, StrictMode double effects, parallel 401s) shares one
   * request, because two parallel refreshes would look like token reuse and revoke all sessions.
   */
  refreshAccessToken(): Promise<RefreshResponse> {
    const refreshToken = refreshTokenStore.get();
    if (!refreshToken) return Promise.reject(new ApiError('No active session.', 401, 'NO_REFRESH_TOKEN'));
    refreshInFlight ??= apiService
      .post<unknown>(API_URLS.AUTH.REFRESH, { refreshToken }, AUTH_CALL)
      .then((body) => {
        const parsed = parseLoginData(body);
        refreshTokenStore.set(parsed.refreshToken); // rotated: the old one is now invalid
        return parsed.session;
      })
      .catch((e: unknown) => {
        refreshTokenStore.clear(); // expired / revoked / reused: the session can't be recovered
        throw e;
      })
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  },

  /** Not used by the current backend (refresh already returns the user). Kept for APIs that omit it. */
  async getCurrentUser(accessToken?: string): Promise<User> {
    const body = await apiService.get<unknown>(API_URLS.AUTH.ME, {
      ...AUTH_CALL,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    const u = unwrap(body) as Partial<Record<keyof User, unknown>> | null;
    if (!u || !isNonEmptyString(u.id) || !isNonEmptyString(u.email)) throw invalid('user profile');
    return {
      id: u.id,
      email: u.email,
      name: isNonEmptyString(u.name) ? u.name : u.email,
      roles: toRoles(u.roles),
      permissions: toStringList(u.permissions),
    };
  },

  /** Restores the session on startup / page reload from the stored refresh token. Returns null when there is none. */
  async checkAuthentication(): Promise<AuthSession | null> {
    try {
      const { accessToken, user } = await authService.refreshAccessToken();
      return { accessToken, user: user ?? (await authService.getCurrentUser(accessToken)) };
    } catch {
      return null;
    }
  },
};

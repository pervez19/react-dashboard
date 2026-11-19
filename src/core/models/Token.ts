import type { User } from './User';

/** Claims we read from the access token for UX only (expiry). The signature is verified by the backend. */
export interface JwtPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  [claim: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** POST /auth/refresh. `user` is optional because the backend contract may omit it. */
export interface RefreshResponse {
  accessToken: string;
  user?: User;
}

/** An authenticated session as held in memory. The refresh token never reaches JS (HttpOnly cookie). */
export interface AuthSession {
  accessToken: string;
  user: User;
}

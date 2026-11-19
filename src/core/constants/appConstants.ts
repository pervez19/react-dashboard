export const APP_NAME = 'React Dashboard';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADMIN: '/dashboard/admin',
  DOCS: '/dashboard/docs',
  UNAUTHORIZED: '/unauthorized',
} as const;

/** Where users land after login when they weren't sent to login from a protected page. */
export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.DASHBOARD;

/** Refresh the access token this many seconds before it expires, to avoid a guaranteed 401. */
export const TOKEN_EXPIRY_SKEW_SECONDS = 30;

export const NOTIFICATION_AUTO_HIDE_MS = 6000;
export const MAX_VISIBLE_NOTIFICATIONS = 3;

/** CSRF double-submit cookie/header names; must match the backend. */
export const XSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const XSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/** Header the API gateway's ApiKeyFilter reads (AppConstant.GATEWAY_KEY). */
export const GATEWAY_KEY_HEADER = 'gatewayKey';

export const PASSWORD_MIN_LENGTH = 8;

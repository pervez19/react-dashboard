import axios, { type AxiosRequestConfig } from 'axios';
import { env } from '../constants/env';
import { GATEWAY_KEY_HEADER, XSRF_COOKIE_NAME, XSRF_HEADER_NAME } from '../constants/appConstants';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Never try to refresh the token for this request (auth endpoints). */
    skipAuthRefresh?: boolean;
    /** The caller shows the error itself (e.g. inline form errors). */
    skipErrorNotification?: boolean;
    /** Internal: set once a request has been retried after a refresh. */
    _retry?: boolean;
  }
}

/** True for relative URLs and absolute URLs under our base URL. Credentials must never go anywhere else. */
export function isOwnApiRequest(config: Pick<AxiosRequestConfig, 'url' | 'baseURL'>): boolean {
  const url = config.url ?? '';
  const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('//');
  if (!isAbsolute) return true;
  // Compare origins, not string prefixes: "https://api.test.evil.com" starts with "https://api.test".
  try {
    return !!config.baseURL && new URL(url, config.baseURL).origin === new URL(config.baseURL).origin;
  } catch {
    return false;
  }
}

/** The only Axios instance in the app. Interceptors are attached once in index.tsx. */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  // Required so the browser sends and accepts the HttpOnly refresh-token cookie.
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    // Every request (auth endpoints included) must carry the gateway API key.
    [GATEWAY_KEY_HEADER]: env.gatewayApiKey,
  },
  // CSRF double-submit: the backend sets a readable XSRF cookie; Axios echoes it in a header.
  xsrfCookieName: XSRF_COOKIE_NAME,
  xsrfHeaderName: XSRF_HEADER_NAME,
  withXSRFToken: isOwnApiRequest,
});

/** Thin typed helpers that unwrap `response.data`. Feature services use these. */
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(url, config).then((r) => r.data),
};

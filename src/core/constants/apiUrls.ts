/** Paths relative to VITE_API_BASE_URL. */
export const API_URLS = {
  AUTH: {
    LOGIN: '/v1/auth/signin',
    REGISTER: '/v1/auth/signup',
    REFRESH: '/v1/auth/refresh-token',
    LOGOUT: '/v1/auth/logout',
    ME: '/auth/me',
  },
} as const;

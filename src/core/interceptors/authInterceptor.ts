import axios, { type AxiosInstance } from 'axios';
import { authService } from '../services/authService';
import { isOwnApiRequest } from '../services/apiService';
import { isTokenExpired } from '../utils/jwtUtils';
import { TOKEN_EXPIRY_SKEW_SECONDS } from '../constants/appConstants';
import { sessionExpired, tokenRefreshed } from '../../store/authStore';
import type { AppStore } from '../../store';

const bearer = (token: string) => `Bearer ${token}`;

/** Refreshes once for all callers (authService is single-flight); ends the session if it fails. */
async function refreshSession(store: AppStore): Promise<string> {
  try {
    const refreshed = await authService.refreshAccessToken();
    store.dispatch(tokenRefreshed(refreshed));
    return refreshed.accessToken;
  } catch (e) {
    // The first failure ends the session; concurrent ones see isAuthenticated=false and stay quiet.
    if (store.getState().auth.isAuthenticated) store.dispatch(sessionExpired());
    throw e;
  }
}

/** Must be registered BEFORE the error interceptor. Returns an eject function. */
export function setupAuthInterceptor(client: AxiosInstance, store: AppStore): () => void {
  const requestId = client.interceptors.request.use(async (config) => {
    // Only our own API may receive the token: an absolute URL to another host never does.
    if (config.headers.has('Authorization') || !isOwnApiRequest(config)) return config;
    let token = store.getState().auth.accessToken;
    if (!token) return config;

    // Proactive refresh: don't send a token we already know is (about to be) expired.
    if (!config.skipAuthRefresh && isTokenExpired(token, TOKEN_EXPIRY_SKEW_SECONDS)) {
      token = await refreshSession(store);
    }
    config.headers.set('Authorization', bearer(token));
    return config;
  });

  const responseId = client.interceptors.response.use(undefined, async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) throw error;
    const config = error.config;
    // Never refresh for auth endpoints, already-retried requests, or when nobody is signed in.
    if (config.skipAuthRefresh || config._retry || !store.getState().auth.isAuthenticated) throw error;
    config._retry = true;

    let token = store.getState().auth.accessToken;
    // If the token changed while this request was in flight, another request already refreshed: just retry.
    if (!token || config.headers.get('Authorization') === bearer(token)) {
      try {
        token = await refreshSession(store); // concurrent 401s all wait on the same refresh
      } catch {
        throw error;
      }
    }

    config.headers.set('Authorization', bearer(token));
    return client(config);
  });

  return () => {
    client.interceptors.request.eject(requestId);
    client.interceptors.response.eject(responseId);
  };
}

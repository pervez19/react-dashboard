import axios, { type AxiosInstance } from 'axios';
import { notificationService } from '../services/notificationService';
import type { ApiErrorBody, FieldErrors } from '../../shared/types/sharedTypes';

/** The single error type that leaves the API layer. */
export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status, or 0 for network/timeout/cancel/invalid-response failures. */
    readonly status: number,
    readonly code: string,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const GENERIC: Record<number, string> = {
  400: 'The request was invalid.',
  401: 'Your session is not valid. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This conflicts with existing data.',
  422: 'Some fields are invalid.',
  429: 'Too many requests. Please try again shortly.',
  500: 'Something went wrong on our side. Please try again later.',
};

// Only statuses whose server message is meant for end users; other text (e.g. 5xx) may leak internals.
const USER_FACING_SERVER_MESSAGE = new Set([400, 409, 422]);

const safeServerMessage = (body: ApiErrorBody | undefined): string | undefined =>
  typeof body?.message === 'string' && body.message.length > 0 && body.message.length <= 200
    ? body.message
    : undefined;

const toFieldErrors = (raw: unknown): FieldErrors => {
  if (!raw || typeof raw !== 'object') return {};
  const out: FieldErrors = {};
  for (const [field, value] of Object.entries(raw)) {
    const first: unknown = Array.isArray(value) ? value[0] : value;
    if (typeof first === 'string') out[field] = first;
  }
  return out;
};

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error)) return new ApiError('Request was cancelled.', 0, 'CANCELED');
  if (!axios.isAxiosError(error)) return new ApiError(GENERIC[500], 0, 'UNKNOWN');

  if (!error.response) {
    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      ? new ApiError('The request timed out. Please try again.', 0, 'TIMEOUT')
      : new ApiError('Unable to reach the server. Check your connection.', 0, 'NETWORK');
  }

  const { status, headers } = error.response;
  const body = error.response.data as ApiErrorBody | undefined;
  const code = typeof body?.code === 'string' ? body.code : `HTTP_${status}`;
  let message =
    (USER_FACING_SERVER_MESSAGE.has(status) ? safeServerMessage(body) : undefined) ??
    GENERIC[status] ??
    (status >= 500 ? GENERIC[500] : GENERIC[400]);

  if (status === 429) {
    const retryAfter = Number(headers?.['retry-after']);
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      message = `Too many requests. Please try again in ${retryAfter} seconds.`;
    }
  }

  return new ApiError(message, status, code, toFieldErrors(body?.errors));
}

/**
 * Must be registered AFTER the auth interceptor (Axios runs response interceptors in registration order),
 * so it only sees errors the auth layer could not recover from. Rejects with ApiError.
 */
export function setupErrorInterceptor(client: AxiosInstance): () => void {
  const id = client.interceptors.response.use(undefined, (error: unknown) => {
    // Already normalised (e.g. a retried request that failed again): don't notify twice.
    if (error instanceof ApiError) return Promise.reject(error);

    const apiError = normalizeApiError(error);
    const silent =
      (axios.isAxiosError(error) && error.config?.skipErrorNotification) ||
      apiError.status === 401 || // session problems are the auth interceptor's job
      apiError.code === 'CANCELED';

    if (!silent) notificationService.error(apiError.message);
    return Promise.reject(apiError);
  });
  return () => client.interceptors.response.eject(id);
}

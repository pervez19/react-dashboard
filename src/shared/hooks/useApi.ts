import { useCallback, useEffect, useState } from 'react';
import { Status } from '../../core/enums/StatusEnum';
import { ApiError, normalizeApiError } from '../../core/interceptors/errorInterceptor';

interface ApiState<T> {
  status: Status;
  data: T | null;
  error: ApiError | null;
}

/**
 * Runs `fetcher` on mount and whenever it changes (wrap it in useCallback). Aborts on unmount so
 * stale responses never land. The error notification is already shown by the error interceptor.
 */
export function useApi<T>(fetcher: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<ApiState<T>>({ status: Status.LOADING, data: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: Status.LOADING, error: null }));
    fetcher(controller.signal).then(
      (data) => !controller.signal.aborted && setState({ status: Status.SUCCESS, data, error: null }),
      (e: unknown) =>
        !controller.signal.aborted && setState({ status: Status.ERROR, data: null, error: normalizeApiError(e) }),
    );
    return () => controller.abort();
  }, [fetcher, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { ...state, isLoading: state.status === Status.LOADING, reload };
}

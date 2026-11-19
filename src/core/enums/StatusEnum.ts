/** Lifecycle of an async operation (used by useApi and feature pages). */
export enum Status {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

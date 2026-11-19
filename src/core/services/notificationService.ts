import { NotificationType } from '../enums/NotificationTypeEnum';
import { MAX_VISIBLE_NOTIFICATIONS } from '../constants/appConstants';
import type { AppNotification } from '../../shared/types/notificationTypes';

/**
 * Framework-free notification queue, so non-React code (interceptors, thunks) can notify.
 * React reads it through useSyncExternalStore (NotificationProvider / useNotification).
 */
type Listener = () => void;

let items: readonly AppNotification[] = [];
let nextId = 0;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l());

function show(message: string, type: NotificationType = NotificationType.INFO): string {
  // Dedupe: e.g. five failing requests must not stack five identical toasts.
  const existing = items.find((n) => n.message === message && n.type === type);
  if (existing) return existing.id;
  const id = `n${++nextId}`;
  items = [...items, { id, message, type }].slice(-MAX_VISIBLE_NOTIFICATIONS);
  emit();
  return id;
}

export const notificationService = {
  show,
  success: (message: string) => show(message, NotificationType.SUCCESS),
  info: (message: string) => show(message, NotificationType.INFO),
  warning: (message: string) => show(message, NotificationType.WARNING),
  error: (message: string) => show(message, NotificationType.ERROR),
  dismiss(id: string) {
    if (!items.some((n) => n.id === id)) return;
    items = items.filter((n) => n.id !== id);
    emit();
  },
  clear() {
    items = [];
    emit();
  },
  getSnapshot: (): readonly AppNotification[] => items,
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

import type { NotificationType } from '../../core/enums/NotificationTypeEnum';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
}

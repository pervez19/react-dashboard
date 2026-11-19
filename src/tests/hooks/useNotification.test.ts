import { act, renderHook } from '@testing-library/react';
import { useNotification } from '../../shared/hooks/useNotification';
import { notificationService } from '../../core/services/notificationService';
import { NotificationType } from '../../core/enums/NotificationTypeEnum';

describe('useNotification', () => {
  beforeEach(() => notificationService.clear());

  it('re-renders with notifications raised anywhere (including outside React)', () => {
    const { result } = renderHook(() => useNotification());
    act(() => {
      result.current.success('Saved');
      notificationService.error('From an interceptor');
    });
    expect(result.current.notifications.map((n) => n.type)).toEqual([NotificationType.SUCCESS, NotificationType.ERROR]);
  });

  it('dismisses a notification', () => {
    const { result } = renderHook(() => useNotification());
    let id = '';
    act(() => {
      id = result.current.info('Hello');
    });
    act(() => result.current.dismiss(id));
    expect(result.current.notifications).toHaveLength(0);
  });
});

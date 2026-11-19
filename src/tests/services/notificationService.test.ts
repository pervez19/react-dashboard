import { notificationService } from '../../core/services/notificationService';
import { NotificationType } from '../../core/enums/NotificationTypeEnum';
import { MAX_VISIBLE_NOTIFICATIONS } from '../../core/constants/appConstants';

describe('notificationService', () => {
  beforeEach(() => notificationService.clear());

  it('adds typed notifications', () => {
    notificationService.success('Saved');
    notificationService.error('Failed');
    expect(notificationService.getSnapshot()).toEqual([
      expect.objectContaining({ message: 'Saved', type: NotificationType.SUCCESS }),
      expect.objectContaining({ message: 'Failed', type: NotificationType.ERROR }),
    ]);
  });

  it('dedupes identical notifications and returns the existing id', () => {
    const a = notificationService.error('Server down');
    const b = notificationService.error('Server down');
    expect(b).toBe(a);
    expect(notificationService.getSnapshot()).toHaveLength(1);
  });

  it(`keeps at most ${MAX_VISIBLE_NOTIFICATIONS}, dropping the oldest`, () => {
    for (let i = 0; i < MAX_VISIBLE_NOTIFICATIONS + 2; i++) notificationService.info(`m${i}`);
    const messages = notificationService.getSnapshot().map((n) => n.message);
    expect(messages).toHaveLength(MAX_VISIBLE_NOTIFICATIONS);
    expect(messages.at(-1)).toBe(`m${MAX_VISIBLE_NOTIFICATIONS + 1}`);
  });

  it('notifies subscribers and stops after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = notificationService.subscribe(listener);
    const id = notificationService.warning('Careful');
    notificationService.dismiss(id);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    notificationService.info('x');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps a stable snapshot reference when nothing changes', () => {
    const before = notificationService.getSnapshot();
    notificationService.dismiss('missing');
    expect(notificationService.getSnapshot()).toBe(before);
  });
});

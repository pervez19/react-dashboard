import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Notification } from '../../core/components/Notification/Notification';
import { NotificationType } from '../../core/enums/NotificationTypeEnum';

const make = (type: NotificationType) => ({ id: 'n1', message: 'Something happened', type });

describe('Notification', () => {
  it('announces errors assertively and others politely', () => {
    const { rerender } = render(<Notification notification={make(NotificationType.ERROR)} onClose={jest.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something happened');
    rerender(<Notification notification={make(NotificationType.SUCCESS)} onClose={jest.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Something happened');
  });

  it('closes via the close button', async () => {
    const onClose = jest.fn();
    render(<Notification notification={make(NotificationType.INFO)} onClose={onClose} autoHideMs={0} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledWith('n1');
  });

  it('auto-hides after the timeout', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    render(<Notification notification={make(NotificationType.INFO)} onClose={onClose} autoHideMs={1000} />);
    act(() => jest.advanceTimersByTime(999));
    expect(onClose).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(onClose).toHaveBeenCalledWith('n1');
    jest.useRealTimers();
  });
});

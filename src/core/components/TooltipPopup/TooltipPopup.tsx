import type { ReactElement, ReactNode } from 'react';
import { Tooltip, type TooltipProps } from '@mui/material';

interface TooltipPopupProps {
  content: ReactNode;
  /** Must be a focusable element so keyboard users can see the tooltip too. */
  children: ReactElement;
  placement?: TooltipProps['placement'];
}

export function TooltipPopup({ content, children, placement = 'top' }: TooltipPopupProps) {
  return (
    <Tooltip title={content} placement={placement} arrow enterTouchDelay={300}>
      {children}
    </Tooltip>
  );
}

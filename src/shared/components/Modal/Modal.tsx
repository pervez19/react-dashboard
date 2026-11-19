import { useId, type ReactNode } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
}

/** Accessible dialog (focus trap, Esc to close, labelled by its title); full screen on phones. */
export function Modal({ open, title, onClose, children, actions, maxWidth = 'sm' }: ModalProps) {
  const titleId = useId();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth={maxWidth} fullScreen={fullScreen}>
      <DialogTitle id={titleId} sx={{ pr: 6 }}>
        {title}
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
}

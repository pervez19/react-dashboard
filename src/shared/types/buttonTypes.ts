import type { ButtonProps as MuiButtonProps } from '@mui/material';
import type { ButtonType } from '../../core/enums/ButtonTypeEnum';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'color'> {
  /** Semantic kind; defaults to PRIMARY. */
  kind?: ButtonType;
}

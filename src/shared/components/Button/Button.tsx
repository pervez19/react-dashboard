import { Button as MuiButton, type ButtonProps as MuiButtonProps } from '@mui/material';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { ButtonType } from '../../../core/enums/ButtonTypeEnum';
import type { ButtonProps } from '../../types/buttonTypes';

const STYLES: Record<ButtonType, Pick<MuiButtonProps, 'variant' | 'color'>> = {
  [ButtonType.PRIMARY]: { variant: 'contained', color: 'primary' },
  [ButtonType.SECONDARY]: { variant: 'outlined', color: 'primary' },
  [ButtonType.DANGER]: { variant: 'contained', color: 'error' },
  [ButtonType.TEXT]: { variant: 'text', color: 'primary' },
};

/**
 * House button. `loading` (native MUI) disables the button and shows a spinner.
 * Polymorphic: pass `component={RouterLink} to="..."` to render a link.
 */
export function Button<C extends ElementType = 'button'>({
  kind = ButtonType.PRIMARY,
  ...props
}: ButtonProps & { component?: C } & Omit<ComponentPropsWithoutRef<C>, keyof ButtonProps>) {
  return <MuiButton {...STYLES[kind]} {...(props as MuiButtonProps)} />;
}

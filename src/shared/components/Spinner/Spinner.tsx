import { Box, CircularProgress } from '@mui/material';

interface SpinnerProps {
  size?: number;
  label?: string;
  /** Fill the parent and centre the spinner. */
  fullArea?: boolean;
}

export function Spinner({ size = 40, label = 'Loading', fullArea = false }: SpinnerProps) {
  return (
    <Box
      role="status"
      aria-label={label}
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, ...(fullArea && { flex: 1, minHeight: 200 }) }}
    >
      <CircularProgress size={size} aria-hidden />
    </Box>
  );
}

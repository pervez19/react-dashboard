import type { ReactNode } from 'react';
import { CssBaseline, ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';

// Material Design 3-ish defaults; light/dark follow the OS and can be toggled (see ThemeToggle in Navbar).
const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: { palette: { primary: { main: '#3f51b5' }, secondary: { main: '#00897b' } } },
    dark: { palette: { primary: { main: '#9fa8da' }, secondary: { main: '#4db6ac' } } },
  },
  shape: { borderRadius: 12 },
  typography: { button: { textTransform: 'none', fontWeight: 600 } },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { fullWidth: true, margin: 'normal' } },
  },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}

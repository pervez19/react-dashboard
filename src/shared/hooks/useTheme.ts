import { useColorScheme } from '@mui/material';
import type { ThemeMode } from '../types/sharedTypes';

/** Light/dark mode. MUI persists the preference (a UI setting, not auth data) and follows the OS by default. */
export function useTheme() {
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved: Exclude<ThemeMode, 'system'> = (mode === 'system' ? systemMode : mode) ?? 'light';

  return {
    mode: (mode ?? 'system') as ThemeMode,
    resolvedMode: resolved,
    setMode: (next: ThemeMode) => setMode(next),
    toggle: () => setMode(resolved === 'dark' ? 'light' : 'dark'),
  };
}

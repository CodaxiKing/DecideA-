import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { usePreferencesStore } from '../stores/preferencesStore';
import { resolveScheme } from './resolveScheme';
import { buildTheme, type Theme } from './tokens';

const ThemeContext = createContext<Theme>(buildTheme('light'));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const preference = usePreferencesStore((s) => s.themePreference);
  const scheme = resolveScheme(preference, system);
  const theme = useMemo(() => buildTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

import type { ThemePreference } from '../stores/preferencesStore';
import type { ColorScheme } from './tokens';

/** Junta a escolha do usuário com o tema do sistema. */
export function resolveScheme(
  preference: ThemePreference,
  system: string | null | undefined,
): ColorScheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

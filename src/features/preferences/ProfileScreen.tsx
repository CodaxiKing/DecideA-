import { View } from 'react-native';

import { AppCard, AppText, FilterChip, Screen } from '../../components/ui';
import { usePreferencesStore, type ThemePreference } from '../../stores/preferencesStore';
import { spacing } from '../../theme/tokens';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Do sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

export function ProfileScreen() {
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);

  return (
    <Screen>
      <AppText variant="title1">Perfil</AppText>
      <AppText color="textMuted">
        Você usa o DecideAí sem conta. Entrar para sincronizar chega na Fase 6.
      </AppText>
      <AppCard>
        <AppText variant="bodyStrong">Aparência</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {themeOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={themePreference === option.value}
              onPress={() => setThemePreference(option.value)}
            />
          ))}
        </View>
      </AppCard>
    </Screen>
  );
}

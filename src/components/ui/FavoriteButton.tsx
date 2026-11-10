import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

import { useFavoritesStore, type FavoriteKind } from '../../stores/favoritesStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useTheme } from '../../theme/ThemeProvider';
import { minTouch } from '../../theme/tokens';
import { Icon } from './Icon';

export function FavoriteButton({ kind, id, name }: { kind: FavoriteKind; id: string; name: string }) {
  const { colors } = useTheme();
  const active = useFavoritesStore((s) => s.items.some((f) => f.kind === kind && f.id === id));
  const toggle = useFavoritesStore((s) => s.toggle);
  const haptics = usePreferencesStore((s) => s.hapticsEnabled);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? `Remover ${name} dos favoritos` : `Salvar ${name} nos favoritos`}
      accessibilityState={{ selected: active }}
      onPress={() => {
        toggle(kind, id);
        if (haptics) Haptics.selectionAsync().catch(() => {});
      }}
      style={({ pressed }) => ({
        width: minTouch,
        height: minTouch,
        borderRadius: minTouch / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={active ? 'heartFilled' : 'heart'} color={active ? colors.primary : colors.text} />
    </Pressable>
  );
}

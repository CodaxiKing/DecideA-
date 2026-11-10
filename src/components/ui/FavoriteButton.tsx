import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

import { useFavoritesStore, type FavoriteKind } from '../../stores/favoritesStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useTheme } from '../../theme/ThemeProvider';
import { minTouch } from '../../theme/tokens';
import { limitMessages, showLimitAlert } from '../../features/premium/limitAlert';
import { canAdd } from '../../features/premium/plans';
import { usePremium } from '../../features/premium/usePremium';
import { Icon } from './Icon';

export function FavoriteButton({ kind, id, name }: { kind: FavoriteKind; id: string; name: string }) {
  const { colors } = useTheme();
  const active = useFavoritesStore((s) => s.items.some((f) => f.kind === kind && f.id === id));
  const toggle = useFavoritesStore((s) => s.toggle);
  const haptics = usePreferencesStore((s) => s.hapticsEnabled);
  const { limits } = usePremium();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? `Remover ${name} dos favoritos` : `Salvar ${name} nos favoritos`}
      accessibilityState={{ selected: active }}
      onPress={() => {
        if (!active && !canAdd(useFavoritesStore.getState().items.length, limits.favorites)) {
          const m = limitMessages.favorites(limits.favorites);
          showLimitAlert(m.title, m.message);
          return;
        }
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

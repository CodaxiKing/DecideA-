import { Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppBadge, AppButton, AppCard, AppText, Icon, Screen } from '../../components/ui';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useWheelStore } from '../../stores/wheelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { newId } from '../../utils/random';
import { usePremium } from '../premium/usePremium';
import { themePacks, themeSectorColor, wheelThemes, type WheelThemeId } from './packs';

function MiniWheel({ theme, size = 56 }: { theme: WheelThemeId; size?: number }) {
  const c = size / 2;
  const n = 6;
  const arc = (i: number) => {
    const p = (deg: number) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return `${c + c * Math.cos(rad)} ${c + c * Math.sin(rad)}`;
    };
    return `M${c} ${c} L${p(i * 60)} A${c} ${c} 0 0 1 ${p((i + 1) * 60)} Z`;
  };
  return (
    <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no">
      {Array.from({ length: n }, (_, i) => (
        <Path key={i} d={arc(i)} fill={themeSectorColor(theme, i, n)} />
      ))}
    </Svg>
  );
}

export function PacksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isPremium } = usePremium();
  const wheelTheme = usePreferencesStore((s) => s.wheelTheme ?? 'classica');
  const setWheelTheme = usePreferencesStore((s) => s.setWheelTheme);

  const openPack = (packId: string) => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    const pack = themePacks.find((p) => p.id === packId)!;
    const wheel = useWheelStore.getState().createWheel({ name: pack.name, options: pack.options.slice(0, 16).map((label) => ({ id: newId(), label })) });
    router.replace({ pathname: '/roleta/[id]', params: { id: wheel.id } });
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Pacotes' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="title1">Pacotes</AppText>
        <AppBadge label="Premium" tone="strong" />
      </View>
      {themePacks.map((p) => (
        <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${p.name}, ${p.options.length} opções`} onPress={() => openPack(p.id)}>
          <AppCard style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <MiniWheel theme={wheelTheme} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{p.name}</AppText>
              <AppText variant="small" color="textMuted">
                {p.options.length} opções
              </AppText>
            </View>
            <Icon name="chevron" color={colors.text} />
          </AppCard>
        </Pressable>
      ))}
      <AppText variant="title3">Temas de roleta</AppText>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.md }}>
        {(Object.keys(wheelThemes) as WheelThemeId[]).map((t) => {
          const on = wheelTheme === t;
          return (
            <Pressable
              key={t}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: !isPremium && t !== 'classica' }}
              accessibilityLabel={wheelThemes[t].name}
              onPress={() => (isPremium || t === 'classica' ? setWheelTheme(t) : router.push('/premium'))}
              style={{ alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, borderWidth: 2, borderColor: on ? colors.primary : 'transparent' }}
            >
              <MiniWheel theme={t} size={64} />
              <AppText variant="small">{wheelThemes[t].name}</AppText>
            </Pressable>
          );
        })}
      </View>
      {!isPremium ? <AppButton label="Liberar com Premium" onPress={() => router.push('/premium')} fullWidth /> : null}
    </Screen>
  );
}

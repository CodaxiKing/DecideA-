import { Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppBadge, AppButton, AppCard, AppText, EmptyState, Screen, WheelArt } from '../../components/ui';
import { useHistoryStore } from '../../stores/historyStore';
import { useWheelStore } from '../../stores/wheelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { formatDayLabel, formatRelativeDay, formatTime } from '../../utils/dates';
import { limitMessages, showLimitAlert } from '../premium/limitAlert';
import { canAdd, usageLabel } from '../premium/plans';
import { usePremium } from '../premium/usePremium';
import type { Wheel } from './types';

function describe(wheel: Wheel): string {
  const spun = wheel.lastSpunAt ? `girada ${formatRelativeDay(wheel.lastSpunAt)}` : 'nunca girada';
  return `${wheel.options.length} opções · ${spun}`;
}

export function WheelListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const wheels = useWheelStore((s) => s.wheels);
  const last = useHistoryStore((s) => s.entries.find((e) => e.kind === 'wheel'));
  const { isPremium, limits } = usePremium();
  const guard = (go: () => void) => () => {
    if (canAdd(wheels.length, limits.wheels)) go();
    else {
      const m = limitMessages.wheels(limits.wheels);
      showLimitAlert(m.title, m.message);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Minhas roletas' }} />
      {wheels.length === 0 ? (
        <View style={{ minHeight: 320 }}>
          <EmptyState
            illustration={<WheelArt size={120} />}
            title="Nenhuma roleta ainda"
            message="Crie uma do zero ou comece por um modelo pronto."
          />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {wheels.map((wheel) => (
            <Pressable
              key={wheel.id}
              accessibilityRole="button"
              accessibilityLabel={`${wheel.name}, ${describe(wheel)}`}
              onPress={() => router.push({ pathname: '/roleta/[id]', params: { id: wheel.id } })}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <AppCard style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <WheelArt size={72} />
                <View style={{ flex: 1 }}>
                  <AppText variant="title3">{wheel.name}</AppText>
                  <AppText variant="small" color="textMuted">
                    {describe(wheel)}
                  </AppText>
                </View>
              </AppCard>
            </Pressable>
          ))}
        </View>
      )}

      {last ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Última decisão: ${last.title}. Abrir histórico`}
          onPress={() => router.push('/historico')}
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            paddingVertical: 14,
            paddingHorizontal: 18,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="small" color="onPrimary">
              Última decisão
            </AppText>
            <AppText variant="title2" color="onPrimary" numberOfLines={1}>
              {last.title}
            </AppText>
          </View>
          <AppText variant="small" color="onPrimary">
            {formatDayLabel(last.createdAt).toLowerCase()}, {formatTime(last.createdAt)}
          </AppText>
        </Pressable>
      ) : null}

      {!isPremium && wheels.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="smallStrong">{usageLabel(wheels.length, limits.wheels, 'roletas')}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Ver Premium: roletas ilimitadas" onPress={() => router.push('/premium')} style={{ minHeight: 44, justifyContent: 'center' }}>
              <AppBadge label="Ilimitadas" tone="strong" />
            </Pressable>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceStrong, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(1, wheels.length / limits.wheels) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
          </View>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <AppButton label="Nova roleta" onPress={guard(() => router.push('/roleta/editar'))} fullWidth />
        <AppButton label="Usar um modelo pronto" variant="ghost" onPress={guard(() => router.push('/roleta/modelos'))} fullWidth />
      </View>
    </Screen>
  );
}

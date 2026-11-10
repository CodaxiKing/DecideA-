import { useKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { AppButton, AppText, EmptyState, Screen } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { formatClock, remainingSeconds, timerFromStep } from './cookingTimer';
import { findRecipe } from './recipes';

/** Relógio fora do componente (o timer conta pelo horário de término). */
const clockNow = () => Date.now();

/** Passo a passo em tela cheia, com tela sempre ligada e timer que sobrevive ao segundo plano. */
export function CookingModeScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const recipe = findRecipe(id);
  const [step, setStep] = useState(0);
  const [endsAt, setEndsAt] = useState<number>();
  const [notifId, setNotifId] = useState<string>();
  const [now, setNow] = useState(clockNow);

  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(clockNow()), 500);
    return () => clearInterval(t);
  }, [endsAt]);

  const left = endsAt ? remainingSeconds(endsAt, now) : 0;
  useEffect(() => {
    if (endsAt && left === 0) AccessibilityInfo.announceForAccessibility('Tempo esgotado');
  }, [endsAt, left]);

  if (!recipe) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Receita não encontrada" message="Volte e escolha outra." />
      </Screen>
    );
  }

  const text = recipe.steps[step];
  const seconds = timerFromStep(text);

  const startTimer = async () => {
    if (!seconds) return;
    const start = clockNow();
    setEndsAt(start + seconds * 1000);
    setNow(start);
    // Aviso mesmo com o app em segundo plano (se a pessoa permitir).
    try {
      const perm = await Notifications.requestPermissionsAsync();
      if (perm.granted) {
        const nid = await Notifications.scheduleNotificationAsync({
          content: { title: 'Tempo esgotado', body: `${recipe.name}: passo ${step + 1}` },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
        });
        setNotifId(nid);
      }
    } catch {
      // Sem notificação, o timer na tela continua valendo.
    }
  };

  const stopTimer = () => {
    setEndsAt(undefined);
    if (notifId) Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
  };

  const go = (d: number) => {
    stopTimer();
    setStep((s) => Math.min(recipe.steps.length - 1, Math.max(0, s + d)));
  };

  return (
    <Screen scroll={false} edges={['bottom']} contentStyle={{ justifyContent: 'space-between', gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Modo cozinha' }} />
      <View style={{ gap: spacing.md }}>
        <AppText variant="small" color="textMuted">
          Tela sempre ligada
        </AppText>
        <AppText variant="smallStrong" accessibilityLiveRegion="polite">
          Passo {step + 1} de {recipe.steps.length}
        </AppText>
        <AppText variant="title1" style={{ lineHeight: 42 }}>
          {text}
        </AppText>
      </View>
      {seconds ? (
        <View style={{ alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl }}>
          <AppText variant="display" accessibilityLabel={`Timer ${formatClock(endsAt ? left : seconds)}`}>
            {formatClock(endsAt ? left : seconds)}
          </AppText>
          {endsAt && left === 0 ? (
            <AppText variant="bodyStrong" color="primary">
              Tempo esgotado!
            </AppText>
          ) : null}
          <AppButton label={endsAt ? 'Parar timer' : 'Iniciar timer'} variant={endsAt ? 'ghost' : 'primary'} onPress={endsAt ? stopTimer : startTimer} />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <AppButton label="Anterior" variant="ghost" style={{ flex: 1 }} disabled={step === 0} onPress={() => go(-1)} />
        <AppButton label={step === recipe.steps.length - 1 ? 'Pronto!' : 'Próximo'} style={{ flex: 1 }} disabled={step === recipe.steps.length - 1} onPress={() => go(1)} />
      </View>
    </Screen>
  );
}

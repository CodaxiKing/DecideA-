import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Switch, View, useWindowDimensions } from 'react-native';

import { AppButton, AppText, DecisionResultCard, EmptyState, IconButton, Screen, ShareableResult } from '../../components/ui';
import { SpinningWheel, type SpinningWheelHandle } from '../../components/wheel/SpinningWheel';
import { useHistoryStore } from '../../stores/historyStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useWheelStore } from '../../stores/wheelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { formatTime } from '../../utils/dates';
import { planSpin } from './spin';

type Phase = { kind: 'idle' } | { kind: 'spinning' } | { kind: 'done'; label: string; at: string };

/** Toca do começo; falha de áudio nunca atrapalha o giro. */
function play(player: { seekTo: (s: number) => Promise<void>; play: () => void }) {
  try {
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // sem áudio
  }
}

const numberWords = ['', 'Uma', 'Duas', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez'];

export function WheelSpinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wheel = useWheelStore((s) => s.wheels.find((w) => w.id === id));
  const markSpun = useWheelStore((s) => s.markSpun);
  const addEntry = useHistoryStore((s) => s.addEntry);
  const hapticsEnabled = usePreferencesStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = usePreferencesStore((s) => s.setHapticsEnabled);
  const soundEnabled = usePreferencesStore((s) => s.soundEnabled ?? true);
  const setSoundEnabled = usePreferencesStore((s) => s.setSoundEnabled);
  const spinSound = useAudioPlayer(require('../../../assets/sounds/spin.wav'));
  const winSound = useAudioPlayer(require('../../../assets/sounds/win.wav'));
  const wheelRef = useRef<SpinningWheelHandle>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const labels = useMemo(() => wheel?.options.map((o) => o.label) ?? [], [wheel]);
  const size = Math.min(width - 40, 340);

  if (!wheel) {
    return (
      <Screen scroll={false} edges={[]}>
        <Stack.Screen options={{ title: 'Roleta' }} />
        <EmptyState title="Roleta não encontrada" message="Ela pode ter sido excluída." />
      </Screen>
    );
  }

  const spin = () => {
    if (phase.kind === 'spinning' || !wheelRef.current) return;
    const plan = planSpin(wheelRef.current.getRotation(), labels.length);
    const label = labels[plan.index];
    setPhase({ kind: 'spinning' });
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (soundEnabled) play(spinSound);
    wheelRef.current.spinTo(plan.targetRotation, () => {
      const at = new Date().toISOString();
      setPhase({ kind: 'done', label, at });
      markSpun(wheel.id, at);
      addEntry({ kind: 'wheel', title: label, source: `Roleta ${wheel.name}`, refId: wheel.id, createdAt: at });
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (soundEnabled) play(winSound);
    });
  };


  const count = labels.length;
  const idleText = `${numberWords[count] ?? count} opções, uma decisão.`;

  return (
    <Screen edges={[]} contentStyle={{ alignItems: 'stretch' }}>
      <Stack.Screen
        options={{
          title: wheel.name,
          headerRight: () => (
            <IconButton
              icon="edit"
              label="Editar roleta"
              plain
              disabled={phase.kind === 'spinning'}
              onPress={() => router.push({ pathname: '/roleta/editar', params: { id: wheel.id } })}
            />
          ),
        }}
      />
      <View style={{ alignItems: 'center' }}>
        <SpinningWheel
          ref={wheelRef}
          labels={labels}
          size={size}
          accessibilityLabel={`Roleta com ${count} opções: ${labels.join(', ')}`}
        />
      </View>

      <View accessibilityLiveRegion="polite" style={{ minHeight: 92, justifyContent: 'center' }}>
        {phase.kind === 'idle' && (
          <AppText color="textMuted" style={{ textAlign: 'center' }}>
            {idleText}
          </AppText>
        )}
        {phase.kind === 'spinning' && (
          <AppText variant="title2" style={{ textAlign: 'center' }}>
            Girando…
          </AppText>
        )}
        {phase.kind === 'done' && (
          <ShareableResult fallbackText={`Deu ${phase.label} na roleta "${wheel.name}" do DecideAí!`}>
            <DecisionResultCard title={phase.label} caption={`Roleta ${wheel.name}. Sorteada entre ${count} opções, às ${formatTime(phase.at)}.`} />
          </ShareableResult>
        )}
      </View>

      <View style={{ gap: spacing.sm }}>
        <AppButton
          label={phase.kind === 'spinning' ? 'Girando…' : phase.kind === 'done' ? 'Girar de novo' : 'Girar'}
          onPress={spin}
          disabled={phase.kind === 'spinning'}
          fullWidth
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Switch
              accessibilityLabel="Vibrar ao girar"
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ true: colors.primary, false: colors.surfaceStrong }}
              thumbColor="#FFFFFF"
            />
            <AppText variant="small">Vibrar</AppText>
            <Switch
              accessibilityLabel="Som ao girar"
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ true: colors.primary, false: colors.surfaceStrong }}
              thumbColor="#FFFFFF"
            />
            <AppText variant="small">Som</AppText>
          </View>
          <AppButton label="Histórico" variant="ghost" size="sm" onPress={() => router.push('/historico')} />
        </View>
      </View>
    </Screen>
  );
}

import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText, DecisionResultCard, EmptyState, Screen, ShareableResult } from '../../components/ui';
import { useBattleStore, type BattleKind } from '../../stores/battleStore';
import { useHistoryStore } from '../../stores/historyStore';
import { usePreferenceSignals } from '../../stores/preferenceSignalsStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing, wheelColors } from '../../theme/tokens';
import { itemInfo } from '../catalog/items';
import { currentDuel, stageLabel } from './engine';

function Fighter({ kind, id, label, color, onPress }: { kind: BattleKind; id: string; label: string; color: string; onPress: () => void }) {
  const image = kind === 'wheel' ? undefined : itemInfo(kind, id)?.image;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Escolher ${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.fighter, { backgroundColor: color, opacity: pressed ? 0.85 : 1 }]}
    >
      {image ? (
        <>
          <Image source={image} resizeMode="cover" style={StyleSheet.absoluteFill} />
          <View style={styles.fade} />
        </>
      ) : null}
      <AppText variant="title1" style={styles.name} numberOfLines={3}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function BattleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { kind, options, battle, source, pick, clear } = useBattleStore();
  const haptics = usePreferencesStore((s) => s.hapticsEnabled);
  const logged = useRef<string | undefined>(undefined);
  const label = (id: string) => options.find((o) => o.id === id)?.label ?? id;

  useEffect(() => {
    if (!battle?.winner || !kind || logged.current === battle.winner) return;
    logged.current = battle.winner;
    const entryKind = kind === 'wheel' ? 'wheel' : kind;
    useHistoryStore.getState().addEntry({ kind: entryKind, title: label(battle.winner), source: source ?? 'Batalha', refId: kind === 'wheel' ? undefined : battle.winner });
    if (kind !== 'wheel') usePreferenceSignals.getState().record(kind, battle.winner, 'accept');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle?.winner]);

  if (!battle || !kind) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Nenhuma batalha" message="Volte e escolha as opções." />
      </Screen>
    );
  }

  if (battle.winner) {
    const info = kind === 'wheel' ? undefined : itemInfo(kind, battle.winner);
    return (
      <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
        <Stack.Screen options={{ title: 'Batalha' }} />
        <ShareableResult fallbackText={`${label(battle.winner)} venceu a batalha no DecideAí!`}>
          <DecisionResultCard
            eyebrow="Venceu a batalha"
            title={label(battle.winner)}
            caption={`Depois de ${battle.totalDuels} ${battle.totalDuels === 1 ? 'duelo' : 'duelos'} entre ${battle.total} opções.`}
            image={info?.image}
          />
        </ShareableResult>
        {info ? <AppButton label="Ver detalhes" onPress={() => router.push(info.href)} fullWidth /> : null}
        <AppButton
          label="Batalhar de novo"
          variant="ghost"
          onPress={() => {
            clear();
            router.replace('/batalha');
          }}
          fullWidth
        />
      </Screen>
    );
  }

  const duel = currentDuel(battle)!;
  const choosePick = (id: string) => {
    if (haptics) Haptics.selectionAsync().catch(() => {});
    pick(id);
  };

  return (
    <Screen scroll={false} edges={['bottom']} contentStyle={{ gap: spacing.md }}>
      <Stack.Screen options={{ title: 'Batalha' }} />
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="title3" accessibilityLiveRegion="polite">
            {stageLabel(battle)}
          </AppText>
          <AppText variant="small" color="textMuted">
            Toque na sua preferida
          </AppText>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceStrong, overflow: 'hidden' }}>
          <View style={{ width: `${(battle.duelsDone / battle.totalDuels) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
        </View>
      </View>
      <View style={{ flex: 1, gap: spacing.md }}>
        <Fighter kind={kind} id={duel[0]} label={label(duel[0])} color={wheelColors[0]} onPress={() => choosePick(duel[0])} />
        <View style={[styles.or, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <AppText variant="title3" color="onPrimary">
            ou
          </AppText>
        </View>
        <Fighter kind={kind} id={duel[1]} label={label(duel[1])} color={wheelColors[2]} onPress={() => choosePick(duel[1])} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fighter: { flex: 1, borderRadius: 28, overflow: 'hidden', justifyContent: 'flex-end', padding: spacing.lg, minHeight: 160 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', backgroundColor: 'rgba(10,6,24,0.55)' },
  name: { color: '#FFFFFF' },
  or: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 6,
  },
});

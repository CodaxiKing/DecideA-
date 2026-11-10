import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText, FilterChip, Screen } from '../../components/ui';
import { useActivityStore } from '../../stores/activityStore';
import { useBattleStore, type BattleKind } from '../../stores/battleStore';
import { useFoodStore } from '../../stores/foodStore';
import { useMovieStore } from '../../stores/movieStore';
import { useWheelStore } from '../../stores/wheelStore';
import { spacing } from '../../theme/tokens';
import { sample } from '../../utils/shuffle';
import { itemInfo } from '../catalog/items';
import { pickActivityOptions, pickFoodOptions, pickMovieOptions } from '../pass/options';

const sizes = [4, 8];

export function BattleSetupScreen() {
  const router = useRouter();
  const wheels = useWheelStore((s) => s.wheels);
  const unfinished = useBattleStore((s) => (s.battle && !s.battle.winner ? s.battle : undefined));
  const [kind, setKind] = useState<BattleKind>('food');
  const [size, setSize] = useState(4);
  const [wheelId, setWheelId] = useState<string | undefined>(wheels[0]?.id);

  const begin = () => {
    let options: { id: string; label: string }[] = [];
    let source = '';
    if (kind === 'wheel') {
      const w = wheels.find((x) => x.id === wheelId);
      if (!w) return;
      options = sample(w.options, size).map((o) => ({ id: o.id, label: o.label }));
      source = `Batalha da roleta ${w.name}`;
    } else {
      const ids =
        kind === 'food'
          ? pickFoodOptions(useFoodStore.getState().choices, useFoodStore.getState().filters)
          : kind === 'movie'
            ? pickMovieOptions(useMovieStore.getState().filters)
            : pickActivityOptions(useActivityStore.getState().filters);
      options = ids.slice(0, size).map((id) => ({ id, label: itemInfo(kind, id)?.title ?? id }));
      source = 'Batalha';
    }
    useBattleStore.getState().start(kind, options, source);
    router.push('/batalha/duelo');
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: '' }} />
      <AppText variant="title1">Batalha</AppText>
      <AppText color="textMuted">Duas opções por vez. A preferida avança, até sobrar uma.</AppText>
      {unfinished ? <AppButton label="Continuar a batalha em andamento" variant="ghost" onPress={() => router.push('/batalha/duelo')} fullWidth /> : null}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">O que vai batalhar?</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <FilterChip label="Comida" selected={kind === 'food'} onPress={() => setKind('food')} />
          <FilterChip label="Filme" selected={kind === 'movie'} onPress={() => setKind('movie')} />
          <FilterChip label="Atividade" selected={kind === 'activity'} onPress={() => setKind('activity')} />
          {wheels.length ? <FilterChip label="Uma roleta minha" selected={kind === 'wheel'} onPress={() => setKind('wheel')} /> : null}
        </View>
      </View>
      {kind === 'wheel' ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="smallStrong">Qual roleta?</AppText>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {wheels.map((w) => (
              <FilterChip key={w.id} label={w.name} selected={wheelId === w.id} onPress={() => setWheelId(w.id)} />
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">Quantas opções?</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
          {sizes.map((n) => (
            <FilterChip key={n} label={String(n)} selected={size === n} onPress={() => setSize(n)} />
          ))}
        </View>
        <AppText variant="small" color="textMuted">
          {size - 1} duelos. Com número ímpar de opções, uma sorteada passa direto de fase.
        </AppText>
      </View>
      <AppButton label="Começar a batalha" onPress={begin} fullWidth />
    </Screen>
  );
}

import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText, DecisionResultCard, FilterChip, Screen, ShareableResult } from '../../components/ui';
import { useHistoryStore } from '../../stores/historyStore';
import { spacing } from '../../theme/tokens';
import { itemInfo } from '../catalog/items';
import { pickSurprise, type Surprise, type SurpriseCompany, type SurpriseWant } from './engine';

const minutesList = [15, 40, 60, 120];
const companies: { v: SurpriseCompany; l: string }[] = [
  { v: 'sozinho', l: 'Sozinho' },
  { v: 'dupla', l: 'Em dupla' },
  { v: 'grupo', l: 'Em grupo' },
];
const wantsList: { v: SurpriseWant; l: string }[] = [
  { v: 'cozinhar', l: 'Cozinhar' },
  { v: 'sair', l: 'Sair de casa' },
  { v: 'assistir', l: 'Assistir' },
  { v: 'jogar', l: 'Jogar' },
];

export function SurpriseScreen() {
  const router = useRouter();
  const [minutes, setMinutes] = useState(40);
  const [company, setCompany] = useState<SurpriseCompany>();
  const [wants, setWants] = useState<SurpriseWant[]>([]);
  const [result, setResult] = useState<Surprise | null>();

  const surprise = () => {
    const seen = new Set(useHistoryStore.getState().entries.map((e) => e.refId).filter(Boolean) as string[]);
    const s = pickSurprise({ minutes, company, wants }, seen, result?.id);
    setResult(s ?? null);
    if (s) {
      const info = itemInfo(s.kind, s.id);
      useHistoryStore.getState().addEntry({ kind: s.kind, title: info?.title ?? s.id, source: 'Modo Surpresa', refId: s.id });
    }
  };

  const info = result ? itemInfo(result.kind, result.id) : undefined;

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: '' }} />
      <AppText variant="title1">Me surpreenda</AppText>
      {result && info ? (
        <>
          <ShareableResult fallbackText={`${result.hook} ${result.pitch} Sugestão do DecideAí.`}>
            <DecisionResultCard eyebrow={result.hook} title={result.pitch} image={info.image} caption={info.subtitle} />
          </ShareableResult>
          <AppButton label="Ver sugestão" onPress={() => router.push(info.href)} fullWidth />
          <AppButton label="Outra surpresa" variant="ghost" onPress={surprise} fullWidth />
          <AppButton label="Mudar as respostas" variant="ghost" size="sm" onPress={() => setResult(undefined)} fullWidth />
        </>
      ) : (
        <>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="bodyStrong">Quanto tempo você tem?</AppText>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {minutesList.map((m) => (
                <FilterChip key={m} label={m < 60 ? `${m} min` : `${m / 60} h`} selected={minutes === m} onPress={() => setMinutes(m)} />
              ))}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="bodyStrong">Está com alguém?</AppText>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {companies.map((c) => (
                <FilterChip key={c.v} label={c.l} selected={company === c.v} onPress={() => setCompany(company === c.v ? undefined : c.v)} />
              ))}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="bodyStrong">Vale o quê?</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {wantsList.map((w) => (
                <FilterChip
                  key={w.v}
                  multi
                  label={w.l}
                  selected={wants.includes(w.v)}
                  onPress={() => setWants((list) => (list.includes(w.v) ? list.filter((x) => x !== w.v) : [...list, w.v]))}
                />
              ))}
            </View>
            <AppText variant="small" color="textMuted">
              Sem escolher, vale tudo.
            </AppText>
          </View>
          {result === null ? (
            <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
              Nada cabe nesse tempo com essas escolhas. Tente mais tempo ou outra opção.
            </AppText>
          ) : null}
          <AppButton label="Surpreender" onPress={surprise} fullWidth />
        </>
      )}
    </Screen>
  );
}

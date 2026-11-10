import { Stack, useRouter } from 'expo-router';
import { Alert, Image, Switch, View } from 'react-native';

import { AppBadge, AppButton, AppCard, AppText, FilterChip, Icon, Screen } from '../../components/ui';
import { syncRepository } from '../../repositories/syncRepository';
import { useAuth } from '../../services/auth';
import { supabase } from '../../services/supabase';
import { useHistoryStore } from '../../stores/historyStore';
import { usePreferenceSignals, type RepeatWindow } from '../../stores/preferenceSignalsStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { activityById } from '../activities/catalog';
import { findRecipe } from '../food/recipes';
import { categoryLabels } from '../food/types';
import { findDemoTitle } from '../movies/catalog';
import { genreLabels } from '../movies/types';
import { usePremium } from '../premium/usePremium';
import { daysUntilBack, learnedTags, recentDecisions, type PreferenceSignal } from './engine';

function tagsOf(s: PreferenceSignal): string[] {
  if (s.kind === 'food') {
    const r = findRecipe(s.id);
    return r ? [...r.categories.map((c) => categoryLabels[c]), r.minutes <= 30 ? 'Até 30 min' : 'Mais demorados'] : [];
  }
  if (s.kind === 'movie') {
    const t = findDemoTitle(s.id);
    return t ? t.genres.map((g) => genreLabels[g]) : [];
  }
  const a = activityById(s.id);
  return a ? a.tags : [];
}

function itemInfo(kind: string, id: string) {
  if (kind === 'food') {
    const r = findRecipe(id);
    return r ? { title: r.name, image: r.image } : undefined;
  }
  if (kind === 'movie') {
    const t = findDemoTitle(id);
    return t ? { title: t.title, image: t.image } : undefined;
  }
  const a = activityById(id);
  return a ? { title: a.name, image: a.image } : undefined;
}

const windows: RepeatWindow[] = [3, 7, 30];

export function PreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isPremium } = usePremium();
  const { user, registered } = useAuth();
  const p = usePreferenceSignals();
  const entries = useHistoryStore((s) => s.entries);
  const { liked, disliked } = learnedTags(Object.values(p.signals), tagsOf);

  const resting = (['food', 'movie', 'activity'] as const).flatMap((kind) =>
    [...recentDecisions(entries, kind, p.repeatDays).entries()].flatMap(([id, at]) => {
      const info = itemInfo(kind, id);
      return info ? [{ key: `${kind}:${id}`, ...info, back: daysUntilBack(at, p.repeatDays) }] : [];
    }),
  );

  const confirmClear = () =>
    Alert.alert('Apagar o que foi aprendido?', 'As sugestões voltam a ser sorteadas sem levar em conta seu gosto.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          p.clear();
          // Apaga também na conta, senão a sincronização traria tudo de volta.
          if (registered && user && supabase) syncRepository(supabase, user.id).clearSignals().catch(() => {});
        },
      },
    ]);

  const switchRow = (title: string, subtitle: string | undefined, value: boolean, onChange: (v: boolean) => void) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? (
          <AppText variant="small" color="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.surfaceStrong }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Suas preferências' }} />
      {!isPremium ? (
        <AppCard>
          <AppBadge label="Premium" tone="strong" />
          <AppText variant="small">
            Evitar repetições funciona em todos os planos. Sugestões que levam em conta o seu gosto são do Premium; enquanto isso, o app
            já vai aprendendo.
          </AppText>
          <AppButton label="Ver Premium" size="sm" variant="ghost" onPress={() => router.push('/premium')} />
        </AppCard>
      ) : null}
      <AppCard>{switchRow('Aprender com minhas escolhas', 'Usa só o que você aceita ou recusa no app', p.learn, p.setLearn)}</AppCard>
      <AppCard style={{ gap: spacing.md }}>
        {switchRow('Evitar repetições', undefined, p.avoidRepeats, p.setAvoidRepeats)}
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
          {windows.map((d) => (
            <FilterChip key={d} label={`${d} dias`} selected={p.repeatDays === d} onPress={() => p.setRepeatDays(d)} />
          ))}
        </View>
      </AppCard>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="title3">Você costuma aceitar</AppText>
        {liked.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {liked.map((t) => (
              <AppBadge key={t} label={t} />
            ))}
          </View>
        ) : (
          <AppText variant="small" color="textMuted">
            Ainda aprendendo. Vote, favorite e responda &ldquo;Deu certo?&rdquo;.
          </AppText>
        )}
      </View>
      {disliked.length ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="title3">Você costuma recusar</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {disliked.map((t) => (
              <AppBadge key={t} label={t} />
            ))}
          </View>
        </View>
      ) : null}

      {p.avoidRepeats && resting.length ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="title3">Sem repetir por enquanto</AppText>
          {resting.map((r) => (
            <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60 }}>
              {r.image ? (
                <Image source={r.image} style={{ width: 52, height: 52, borderRadius: 16 }} />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="clock" color={colors.text} />
                </View>
              )}
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {r.title}
              </AppText>
              <AppText variant="small" color="textMuted">
                {r.back <= 1 ? 'volta amanhã' : `volta em ${r.back} dias`}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <AppButton label="Apagar o que foi aprendido" variant="ghost" onPress={confirmClear} fullWidth />
    </Screen>
  );
}

import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { PosterThumb } from '../../components/movies/PosterThumb';
import { AppButton, AppText, EmptyState, FilterChip, Screen } from '../../components/ui';
import { useMovieStore } from '../../stores/movieStore';
import { spacing } from '../../theme/tokens';
import { findDemoTitle } from './catalog';
import { titleSummary, type MovieVote } from './types';

const tabs: { v: MovieVote; l: string }[] = [
  { v: 'yes', l: 'Quero' },
  { v: 'maybe', l: 'Talvez' },
  { v: 'no', l: 'Não' },
];

export function MyVotesScreen() {
  const router = useRouter();
  const votes = useMovieStore((s) => s.votes);
  const [tab, setTab] = useState<MovieVote>('yes');

  const entries = Object.entries(votes).sort((a, b) => b[1].at.localeCompare(a[1].at));
  const count = (v: MovieVote) => entries.filter(([, x]) => x.vote === v).length;
  const list = entries.filter(([, x]) => x.vote === tab).flatMap(([id]) => {
    const t = findDemoTitle(id);
    return t ? [t] : [];
  });

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Meus votos' }} />
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <FilterChip key={t.v} label={`${t.l} (${count(t.v)})`} selected={tab === t.v} onPress={() => setTab(t.v)} />
        ))}
      </View>
      {list.length === 0 ? (
        <View style={{ minHeight: 320 }}>
          <EmptyState
            title="Nada aqui ainda"
            message="Vote nos cartões de filmes e séries para montar suas listas."
            action={<AppButton label="Votar em títulos" onPress={() => router.dismissTo('/filmes')} />}
          />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {list.map((t) => (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={`${t.title}. ${titleSummary(t)}`}
              onPress={() => router.push({ pathname: '/filmes/[id]', params: { id: t.id } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <PosterThumb title={t} />
              <View style={{ flex: 1 }}>
                <AppText variant="title3">{t.title}</AppText>
                <AppText variant="small" color="textMuted">
                  {titleSummary(t)}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {tab === 'yes' && list.length > 1 ? (
        <AppButton label="Votar estes com alguém" onPress={() => router.push({ pathname: '/passa', params: { kind: 'movie', from: 'votes' } })} fullWidth />
      ) : null}
    </Screen>
  );
}

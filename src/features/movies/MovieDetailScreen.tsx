import { Stack, useLocalSearchParams } from 'expo-router';
import { Image, View } from 'react-native';

import { AppBadge, AppText, EmptyState, FilterChip, Screen } from '../../components/ui';
import { FavoriteButton } from '../../components/ui/FavoriteButton';
import { useMovieStore } from '../../stores/movieStore';
import { radius, spacing } from '../../theme/tokens';
import { findDemoTitle, movieCatalog } from './catalog';
import { genreLabels, titleSummary, type MovieVote } from './types';

const voteOptions: { v: MovieVote; l: string }[] = [
  { v: 'yes', l: 'Quero' },
  { v: 'maybe', l: 'Talvez' },
  { v: 'no', l: 'Não quero' },
];

export function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = findDemoTitle(id);
  const current = useMovieStore((s) => (id ? s.votes[id]?.vote : undefined));
  const vote = useMovieStore((s) => s.vote);

  if (!t) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Título não encontrado" message="Ele pode ter saído do catálogo." />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: '', headerRight: () => <FavoriteButton kind="movie" id={t.id} name={t.title} /> }} />
      <View style={{ height: 260, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.posterColor, justifyContent: 'flex-end', padding: spacing.lg }}>
        {t.image ? <Image source={t.image} resizeMode="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
        {movieCatalog.isDemo ? <AppBadge label="Demonstração" tone="strong" /> : null}
      </View>
      <AppText variant="title1">{t.title}</AppText>
      <AppText color="textMuted">{titleSummary(t)}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {t.genres.map((g) => (
          <AppBadge key={g} label={genreLabels[g]} />
        ))}
      </View>
      <AppText>{t.synopsis}</AppText>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">Seu voto</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {voteOptions.map((o) => (
            <FilterChip key={o.v} label={o.l} selected={current === o.v} onPress={() => vote(t.id, o.v)} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

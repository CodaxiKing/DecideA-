import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton, AppText, FilterChip, Screen } from '../../components/ui';
import { useMovieStore } from '../../stores/movieStore';
import { spacing } from '../../theme/tokens';
import { emptyMovieFilters, movieCatalog, type MovieFilters } from './catalog';
import { ageRatings, genreLabels, type Genre, type TitleKind } from './types';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="smallStrong">{title}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>
    </View>
  );
}

export function MovieFiltersScreen() {
  const router = useRouter();
  const current = useMovieStore((s) => s.filters);
  const setFilters = useMovieStore((s) => s.setFilters);
  const [draft, setDraft] = useState<MovieFilters>(current);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    movieCatalog.list(draft).then((l) => alive && setCount(l.length));
    return () => {
      alive = false;
    };
  }, [draft]);

  const kinds: { v: TitleKind; l: string }[] = [
    { v: 'filme', l: 'Filme' },
    { v: 'serie', l: 'Série' },
  ];
  const durations = [
    { v: 90, l: 'Até 90 min' },
    { v: 120, l: 'Até 2 h' },
  ];
  const eras: { v: NonNullable<MovieFilters['era']>; l: string }[] = [
    { v: 'recentes', l: '2020+' },
    { v: 'decada', l: '2010+' },
    { v: 'classicos', l: 'Clássicos' },
  ];

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen
        options={{
          title: 'Filtros',
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={() => setDraft(emptyMovieFilters)} style={{ minHeight: 44, justifyContent: 'center' }}>
              <AppText variant="bodyStrong" style={{ textDecorationLine: 'underline' }}>
                Limpar
              </AppText>
            </Pressable>
          ),
        }}
      />
      <Group title="Tipo">
        {kinds.map((k) => (
          <FilterChip key={k.v} multi label={k.l} selected={draft.kinds.includes(k.v)} onPress={() => setDraft((d) => ({ ...d, kinds: toggle(d.kinds, k.v) }))} />
        ))}
      </Group>
      <Group title="Gênero">
        {(Object.keys(genreLabels) as Genre[]).map((g) => (
          <FilterChip key={g} multi label={genreLabels[g]} selected={draft.genres.includes(g)} onPress={() => setDraft((d) => ({ ...d, genres: toggle(d.genres, g) }))} />
        ))}
      </Group>
      <Group title="Duração">
        {durations.map((x) => (
          <FilterChip
            key={x.v}
            label={x.l}
            selected={draft.maxMinutes === x.v}
            onPress={() => setDraft((d) => ({ ...d, maxMinutes: d.maxMinutes === x.v ? undefined : x.v }))}
          />
        ))}
      </Group>
      <Group title="Ano">
        {eras.map((x) => (
          <FilterChip key={x.v} label={x.l} selected={draft.era === x.v} onPress={() => setDraft((d) => ({ ...d, era: d.era === x.v ? undefined : x.v }))} />
        ))}
      </Group>
      <Group title="Classificação indicativa máxima">
        {ageRatings.map((r) => (
          <FilterChip
            key={r}
            label={r === 'L' ? 'Livre' : `${r} anos`}
            selected={draft.maxRating === r}
            onPress={() => setDraft((d) => ({ ...d, maxRating: d.maxRating === r ? undefined : r }))}
          />
        ))}
      </Group>
      {!movieCatalog.hasStreamingData ? (
        <AppText variant="small" color="textMuted">
          Filtro por plataforma de streaming aparece quando o catálogo licenciado tiver esse dado.
        </AppText>
      ) : null}
      <AppButton
        label={count === null ? 'Aplicar' : count === 0 ? 'Nenhum título' : `Ver ${count} ${count === 1 ? 'título' : 'títulos'}`}
        onPress={() => {
          setFilters(draft);
          router.back();
        }}
        fullWidth
      />
    </Screen>
  );
}

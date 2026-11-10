import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { SwipeDeck, type DeckItem, type DeckVote } from '../../components/swipe/SwipeDeck';
import { AppButton, AppText, EmptyState, IconButton, LoadingState, Screen } from '../../components/ui';
import { useMovieStore } from '../../stores/movieStore';
import { spacing } from '../../theme/tokens';
import { shuffle } from '../../utils/shuffle';
import { sortByPreference } from '../preferences/smartPick';
import { activeMovieFilterCount, movieCatalog } from './catalog';
import { movieToDeckItem } from './deckItems';
import type { MovieTitle } from './types';

export function MoviesScreen() {
  const router = useRouter();
  const filters = useMovieStore((s) => s.filters);
  const vote = useMovieStore((s) => s.vote);
  const [round, setRound] = useState(0);
  const requestKey = `${JSON.stringify(filters)}#${round}`;
  const [loaded, setLoaded] = useState<{ key: string; titles: MovieTitle[]; error: boolean } | null>(null);
  const fresh = loaded?.key === requestKey;
  const titles = fresh ? loaded.titles : null;
  const error = fresh ? loaded.error : false;
  const [tally, setTally] = useState({ yes: 0, maybe: 0, no: 0 });
  const [ended, setEnded] = useState(false);
  const filterCount = activeMovieFilterCount(filters);

  useEffect(() => {
    let alive = true;
    movieCatalog
      .list(filters)
      .then((list) => {
        if (!alive) return;
        const voted = useMovieStore.getState().votes;
        // Primeiro o que a pessoa ainda não votou; depois o resto, para não acabar cedo demais.
        const unseen = sortByPreference('movie', shuffle(list.filter((t) => !voted[t.id])), (t) => t.id);
        setLoaded({ key: requestKey, titles: unseen.length ? unseen : shuffle(list), error: false });
      })
      .catch(() => alive && setLoaded({ key: requestKey, titles: [], error: true }));
    return () => {
      alive = false;
    };
  }, [filters, requestKey]);

  const items = useMemo<DeckItem[]>(() => (titles ?? []).map((t) => movieToDeckItem(t, movieCatalog.isDemo)), [titles]);

  const onVote = useCallback(
    (item: DeckItem, v: DeckVote) => {
      vote(item.id, v);
      setTally((t) => ({ ...t, [v]: t[v] + 1 }));
    },
    [vote],
  );
  const onEnd = useCallback(() => setEnded(true), []);

  const restart = () => {
    setTally({ yes: 0, maybe: 0, no: 0 });
    setEnded(false);
    setRound((r) => r + 1);
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Qual Filme?',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <IconButton icon="heart" label="Meus votos" onPress={() => router.push('/filmes/votos')} />
              <IconButton
                icon="filter"
                label={filterCount ? `Filtros, ${filterCount} ativos` : 'Filtros'}
                onPress={() => router.push('/filmes/filtros')}
              />
            </View>
          ),
        }}
      />
      {movieCatalog.isDemo ? (
        <AppText variant="small" color="textMuted">
          {movieCatalog.name}: títulos fictícios enquanto o catálogo licenciado não chega.
        </AppText>
      ) : null}

      {error ? (
        <EmptyState title="Não deu para carregar" message="Tente de novo em instantes." action={<AppButton label="Tentar de novo" onPress={restart} />} />
      ) : titles === null ? (
        <View style={{ height: 400 }}>
          <LoadingState message="Buscando títulos…" />
        </View>
      ) : titles.length === 0 ? (
        <View style={{ minHeight: 360 }}>
          <EmptyState
            title="Nenhum título"
            message="Nada combina com esses filtros. Tente afrouxar algum."
            action={<AppButton label="Abrir filtros" variant="ghost" onPress={() => router.push('/filmes/filtros')} />}
          />
        </View>
      ) : ended ? (
        <View style={{ gap: spacing.lg, paddingTop: spacing.xl }}>
          <AppText variant="title1">Votos registrados</AppText>
          <AppText color="textMuted">
            {tally.yes} quero · {tally.maybe} talvez · {tally.no} não
          </AppText>
          <AppButton label="Ver meus votos" onPress={() => router.push('/filmes/votos')} fullWidth />
          <AppButton label="Votar de novo" variant="ghost" onPress={restart} fullWidth />
        </View>
      ) : (
        <SwipeDeck key={round} items={items} onVote={onVote} onEnd={onEnd} />
      )}
    </Screen>
  );
}

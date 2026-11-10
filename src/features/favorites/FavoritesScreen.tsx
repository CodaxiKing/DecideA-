import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { recipeSummary } from '../../components/food/RecipeTags';
import { AppCard, AppText, EmptyState, FilterChip, Icon, Screen } from '../../components/ui';
import { useFavoritesStore, type FavoriteKind } from '../../stores/favoritesStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { findRecipe } from '../food/recipes';
import { favoriteMovieRows } from './movieRows';

export function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const items = useFavoritesStore((s) => s.items);
  const [tab, setTab] = useState<FavoriteKind>('food');

  const rows =
    tab === 'food'
      ? items
          .filter((f) => f.kind === 'food')
          .flatMap((f) => {
            const r = findRecipe(f.id);
            return r
              ? [{ id: r.id, title: r.name, subtitle: recipeSummary(r), image: r.image, onPress: () => router.push({ pathname: '/comer/receita/[id]', params: { id: r.id } }) }]
              : [];
          })
      : favoriteMovieRows(items, router);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: '' }} />
      <AppText variant="title1">Favoritos</AppText>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
        <FilterChip label="Pratos" selected={tab === 'food'} onPress={() => setTab('food')} />
        <FilterChip label="Filmes" selected={tab === 'movie'} onPress={() => setTab('movie')} />
      </View>
      {rows.length === 0 ? (
        <View style={{ minHeight: 320 }}>
          <EmptyState
            illustration={<Icon name="heart" size={40} color={colors.primary} />}
            title={tab === 'food' ? 'Nenhum prato salvo' : 'Nenhum filme salvo'}
            message={
              tab === 'food'
                ? 'Toque no coração de uma receita para guardar aqui.'
                : 'Toque no coração de um filme para guardar aqui.'
            }
          />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {rows.map((row) => (
            <Pressable key={row.id} accessibilityRole="button" accessibilityLabel={`${row.title}. ${row.subtitle}`} onPress={row.onPress}>
              <AppCard style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                {row.image ? (
                  <Image source={row.image} style={{ width: 52, height: 52, borderRadius: 16 }} />
                ) : (
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={tab === 'food' ? 'food' : 'film'} color={colors.text} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{row.title}</AppText>
                  <AppText variant="small" color="textMuted">
                    {row.subtitle}
                  </AppText>
                </View>
              </AppCard>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

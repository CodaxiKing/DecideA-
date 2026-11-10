import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { RecipeTags } from '../../components/food/RecipeTags';
import { AppButton, AppText, DecisionResultCard, EmptyState, Screen, ShareableResult } from '../../components/ui';
import { FavoriteButton } from '../../components/ui/FavoriteButton';
import { spacing } from '../../theme/tokens';
import { findRecipe } from './recipes';
import { useDrawRecipe } from './useDrawRecipe';

export function FoodResultScreen() {
  const { id, total } = useLocalSearchParams<{ id: string; total?: string }>();
  const router = useRouter();
  const draw = useDrawRecipe();
  const recipe = findRecipe(id);

  if (!recipe) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Receita não encontrada" message="Volte e sorteie de novo." />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen
        options={{ title: '', headerRight: () => <FavoriteButton kind="food" id={recipe.id} name={recipe.name} /> }}
      />
      <ShareableResult fallbackText={`Hoje vai de ${recipe.name}! Decidido no DecideAí.`}>
        <DecisionResultCard eyebrow="Hoje vai de" title={recipe.name} image={recipe.image}>
          <RecipeTags recipe={recipe} onPrimary />
        </DecisionResultCard>
      </ShareableResult>
      {total ? (
        <AppText variant="small" color="textMuted" style={{ textAlign: 'center' }}>
          Sorteado entre {total} {total === '1' ? 'prato' : 'pratos'}.
        </AppText>
      ) : null}
      <View style={{ gap: 10 }}>
        <AppButton
          label="Ver receita"
          onPress={() => router.push({ pathname: '/comer/receita/[id]', params: { id: recipe.id } })}
          fullWidth
        />
        <AppButton label="Sortear outra" variant="ghost" onPress={() => draw('replace')} fullWidth />
      </View>
    </Screen>
  );
}

import { Stack, useLocalSearchParams } from 'expo-router';
import { Image, Share, View } from 'react-native';

import { AppBadge, AppCard, AppText, EmptyState, IconButton, Screen } from '../../components/ui';
import { FavoriteButton } from '../../components/ui/FavoriteButton';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { findRecipe } from './recipes';
import { categoryLabels, dietLabels, mealLabels, type Recipe } from './types';

function shareText(recipe: Recipe): string {
  const ingredients = recipe.ingredients.map((i) => `• ${i.name}: ${i.quantity}`).join('\n');
  const steps = recipe.steps.map((s, n) => `${n + 1}. ${s}`).join('\n');
  return `${recipe.name} (${recipe.minutes} min, ${recipe.servings} porções)\n\nIngredientes\n${ingredients}\n\nModo de preparo\n${steps}\n\nReceita do DecideAí`;
}

export function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const recipe = findRecipe(id);

  if (!recipe) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Receita não encontrada" message="Ela pode ter saído do catálogo." />
      </Screen>
    );
  }

  const tags = [
    ...recipe.categories.map((c) => categoryLabels[c]),
    ...recipe.diets.map((d) => dietLabels[d]),
    ...recipe.meals.map((m) => mealLabels[m]),
  ];
  const stats = [
    { label: 'Tempo', value: `${recipe.minutes} min` },
    { label: 'Dificuldade', value: recipe.difficulty },
    { label: 'Porções', value: String(recipe.servings) },
  ];

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <IconButton
                icon="share"
                label="Compartilhar receita"
                onPress={() => Share.share({ message: shareText(recipe) }).catch(() => {})}
              />
              <FavoriteButton kind="food" id={recipe.id} name={recipe.name} />
            </View>
          ),
        }}
      />
      {recipe.image ? (
        <Image
          source={recipe.image}
          accessibilityLabel={recipe.imageAlt}
          resizeMode="cover"
          style={{ width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.surfaceStrong }}
        />
      ) : null}
      <AppText variant="title1">{recipe.name}</AppText>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {stats.map((s) => (
          <AppCard key={s.label} style={{ flex: 1, gap: 2 }} accessible accessibilityLabel={`${s.label}: ${s.value}`}>
            <AppText variant="small" color="textMuted">
              {s.label}
            </AppText>
            <AppText variant="title3">{s.value}</AppText>
          </AppCard>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {tags.map((t) => (
          <AppBadge key={t} label={t} />
        ))}
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title2">Ingredientes</AppText>
        {recipe.ingredients.map((ing) => (
          <View key={ing.name} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, minHeight: 28 }}>
            <AppText style={{ flex: 1 }}>{ing.name}</AppText>
            <AppText variant="bodyStrong" style={{ textAlign: 'right', maxWidth: '45%' }}>
              {ing.quantity}
            </AppText>
          </View>
        ))}
      </View>
      <View style={{ gap: spacing.md }}>
        <AppText variant="title2">Modo de preparo</AppText>
        {recipe.steps.map((step, n) => (
          <View key={n} style={{ flexDirection: 'row', gap: spacing.md }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="smallStrong" color="onPrimary">
                {n + 1}
              </AppText>
            </View>
            <AppText style={{ flex: 1 }}>{step}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

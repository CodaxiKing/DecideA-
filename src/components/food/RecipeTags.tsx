import { View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import type { Recipe } from '../../features/food/types';
import { AppText } from '../ui/AppText';

/** Etiquetas de tempo, dificuldade e porções. `onPrimary` para usar sobre o cartão roxo. */
export function RecipeTags({ recipe, onPrimary }: { recipe: Recipe; onPrimary?: boolean }) {
  const { colors } = useTheme();
  const tags = [`${recipe.minutes} min`, recipe.difficulty, `${recipe.servings} ${recipe.servings === 1 ? 'porção' : 'porções'}`];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {tags.map((t) => (
        <View
          key={t}
          style={{
            height: 28,
            paddingHorizontal: 10,
            borderRadius: radius.pill,
            justifyContent: 'center',
            backgroundColor: onPrimary ? 'rgba(255,255,255,0.22)' : colors.primarySoft,
          }}
        >
          <AppText variant="label" color={onPrimary ? 'onPrimary' : 'text'}>
            {t}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function recipeSummary(recipe: Recipe): string {
  return `${recipe.minutes} min · ${recipe.difficulty} · ${recipe.servings} ${recipe.servings === 1 ? 'porção' : 'porções'}`;
}

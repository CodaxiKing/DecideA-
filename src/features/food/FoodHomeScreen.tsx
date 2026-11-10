import { Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppButton, AppCard, AppText, FilterChip, Icon, IconButton, Screen } from '../../components/ui';
import { useFoodStore } from '../../stores/foodStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { activeFilterCount, recipesForChoices, type DrawChoice } from './engine';
import { recipes } from './recipes';
import { categoryLabels, type FoodCategory } from './types';
import { useDrawRecipe } from './useDrawRecipe';

const choiceList: { value: DrawChoice; label: string }[] = [
  ...(Object.keys(categoryLabels) as FoodCategory[]).map((c) => ({ value: c as DrawChoice, label: categoryLabels[c] })),
  { value: 'vegetarianas', label: 'Vegetarianas' },
  { value: 'surpresa', label: 'Surpreenda-me' },
];

export function FoodHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const choices = useFoodStore((s) => s.choices);
  const filters = useFoodStore((s) => s.filters);
  const toggleChoice = useFoodStore((s) => s.toggleChoice);
  const draw = useDrawRecipe();
  const filterCount = activeFilterCount(filters);
  const poolSize = recipesForChoices(recipes, choices, filters).length;

  const surprise = choices.length === 0 || choices.includes('surpresa');
  const drawLabel = surprise
    ? 'Surpreenda-me'
    : choices.length === 1
      ? `Sortear em ${choiceList.find((c) => c.value === choices[0])?.label}`
      : `Sortear entre ${choices.length} categorias`;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon="filter"
              label={filterCount ? `Filtros, ${filterCount} ativos` : 'Filtros'}
              onPress={() => router.push('/comer/filtros')}
            />
          ),
        }}
      />
      <AppText variant="title1">O Que Comer?</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {choiceList.map((c) => (
          <FilterChip
            key={c.value}
            multi
            label={c.label}
            selected={c.value === 'surpresa' ? choices.includes('surpresa') : choices.includes(c.value)}
            onPress={() => toggleChoice(c.value)}
          />
        ))}
      </View>
      {filterCount ? (
        <AppText variant="small" color="textMuted">
          {filterCount} {filterCount === 1 ? 'filtro ativo' : 'filtros ativos'} · {poolSize} {poolSize === 1 ? 'prato possível' : 'pratos possíveis'}
        </AppText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tenho estes ingredientes. Veja o que dá para fazer com o que há em casa"
        onPress={() => router.push('/comer/ingredientes')}
      >
        <AppCard style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">Tenho estes ingredientes</AppText>
            <AppText variant="small" color="textMuted">
              Veja o que dá para fazer com o que há em casa
            </AppText>
          </View>
          <Icon name="chevron" color={colors.text} />
        </AppCard>
      </Pressable>
      <View style={{ gap: 10, marginTop: spacing.sm }}>
        <AppButton label={drawLabel} onPress={() => draw()} disabled={poolSize === 0} fullWidth />
        {poolSize === 0 ? (
          <AppText variant="small" color="danger" style={{ textAlign: 'center' }}>
            Nenhum prato com essas escolhas. Mude as categorias ou os filtros.
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}



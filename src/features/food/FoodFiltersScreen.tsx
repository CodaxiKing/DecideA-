import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton, AppInput, AppText, FilterChip, Icon, Screen } from '../../components/ui';
import { useFoodStore } from '../../stores/foodStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { emptyFilters, ingredientKey, recipesForChoices, type FoodFilters } from './engine';
import { recipes } from './recipes';
import { dietLabels, mealLabels, type DietTag, type MealType } from './types';

const times = [
  { value: 15, label: 'Até 15 min' },
  { value: 30, label: 'Até 30 min' },
  { value: 60, label: 'Até 1 h' },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FoodFiltersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const current = useFoodStore((s) => s.filters);
  const choices = useFoodStore((s) => s.choices);
  const setFilters = useFoodStore((s) => s.setFilters);
  const [draft, setDraft] = useState<FoodFilters>(current);
  const [avoidText, setAvoidText] = useState('');
  const count = recipesForChoices(recipes, choices, draft).length;

  const addAvoid = () => {
    const key = ingredientKey(avoidText);
    if (key && !draft.avoid.includes(key)) setDraft((d) => ({ ...d, avoid: [...d.avoid, key] }));
    setAvoidText('');
  };

  const apply = () => {
    setFilters(draft);
    router.back();
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen
        options={{
          title: 'Filtros',
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={() => setDraft(emptyFilters)} style={{ minHeight: 44, justifyContent: 'center' }}>
              <AppText variant="bodyStrong" style={{ textDecorationLine: 'underline' }}>
                Limpar
              </AppText>
            </Pressable>
          ),
        }}
      />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">Tempo de preparo</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {times.map((t) => (
            <FilterChip
              key={t.value}
              label={t.label}
              selected={draft.maxMinutes === t.value}
              onPress={() => setDraft((d) => ({ ...d, maxMinutes: d.maxMinutes === t.value ? undefined : t.value }))}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">Refeição</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(Object.keys(mealLabels) as MealType[]).map((m) => (
            <FilterChip
              key={m}
              multi
              label={mealLabels[m]}
              selected={draft.meals.includes(m)}
              onPress={() => setDraft((d) => ({ ...d, meals: toggle(d.meals, m) }))}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">Preferências</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(Object.keys(dietLabels) as DietTag[]).map((d) => (
            <FilterChip
              key={d}
              multi
              label={dietLabels[d]}
              selected={draft.diets.includes(d)}
              onPress={() => setDraft((x) => ({ ...x, diets: toggle(x.diets, d) }))}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppInput
          label="Ingredientes a evitar"
          placeholder="Ex.: amendoim"
          value={avoidText}
          onChangeText={setAvoidText}
          onSubmitEditing={addAvoid}
          returnKeyType="done"
          submitBehavior="submit"
          autoCapitalize="none"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {draft.avoid.map((a) => (
            <Pressable
              key={a}
              accessibilityRole="button"
              accessibilityLabel={`Parar de evitar ${a}`}
              onPress={() => setDraft((d) => ({ ...d, avoid: d.avoid.filter((x) => x !== a) }))}
              style={{
                height: 44,
                paddingHorizontal: 16,
                borderRadius: radius.pill,
                backgroundColor: colors.surface,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AppText>{a}</AppText>
              <Icon name="close" size={16} color={colors.text} />
            </Pressable>
          ))}
        </View>
      </View>
      <AppButton
        label={count === 0 ? 'Nenhuma receita' : `Ver ${count} ${count === 1 ? 'receita' : 'receitas'}`}
        onPress={apply}
        fullWidth
      />
    </Screen>
  );
}

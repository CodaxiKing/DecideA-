import { Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppButton, AppText, IconButton, Screen } from '../../components/ui';
import { useKitchenStore } from '../../stores/kitchenStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { dinnerPool, drawWeek, redrawDay, WEEK_DAYS } from './mealPlan';
import { findRecipe, recipes } from './recipes';

export function MealPlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const week = useKitchenStore((s) => s.week);
  const setWeek = useKitchenStore((s) => s.setWeek);
  const pool = dinnerPool(recipes);

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.md }}>
      <Stack.Screen options={{ title: 'Cardápio da semana' }} />
      <AppText variant="title1">Jantares da semana</AppText>
      {week.length === 0 ? (
        <AppText color="textMuted">Sorteie sete jantares sem repetir e gere uma lista única de compras.</AppText>
      ) : (
        WEEK_DAYS.map((day, i) => {
          const r = findRecipe(week[i]);
          return (
            <View key={day} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, paddingLeft: spacing.lg }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${day}: ${r?.name ?? ''}. Abrir receita`}
                onPress={() => r && router.push({ pathname: '/comer/receita/[id]', params: { id: r.id } })}
                style={{ flex: 1, paddingVertical: spacing.md }}
              >
                <AppText variant="small" color="textMuted">
                  {day}
                </AppText>
                <AppText variant="bodyStrong">{r?.name ?? '—'}</AppText>
              </Pressable>
              <IconButton icon="shuffle" plain label={`Trocar o jantar de ${day}`} onPress={() => setWeek(redrawDay(week, i, pool))} />
            </View>
          );
        })
      )}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <AppButton label={week.length ? 'Sortear tudo' : 'Sortear a semana'} style={{ flex: 1 }} onPress={() => setWeek(drawWeek(pool))} />
        {week.length ? (
          <AppButton
            label="Gerar lista"
            variant="ghost"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/comer/lista', params: { ids: week.join(','), title: 'Cardápio da semana' } })}
          />
        ) : null}
      </View>
    </Screen>
  );
}

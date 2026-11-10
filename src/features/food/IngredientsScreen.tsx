import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppCard, AppInput, AppText, EmptyState, Icon, Screen } from '../../components/ui';
import { useFoodStore } from '../../stores/foodStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { describeMissing, matchByIngredients } from './engine';
import { recipes } from './recipes';

export function IngredientsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const ingredients = useFoodStore((s) => s.ingredients);
  const filters = useFoodStore((s) => s.filters);
  const { addIngredient, removeIngredient } = useFoodStore.getState();
  const [text, setText] = useState('');
  const results = matchByIngredients(recipes, ingredients, filters);

  const submit = () => {
    text
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach(addIngredient);
    setText('');
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'O que tem em casa?' }} />
      <AppInput
        label="Adicionar ingrediente"
        placeholder="Ex.: tomate"
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        returnKeyType="done"
        submitBehavior="submit"
        autoCapitalize="none"
      />
      {ingredients.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {ingredients.map((name) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${name}`}
              onPress={() => removeIngredient(name)}
              style={{
                height: 44,
                paddingHorizontal: 16,
                borderRadius: radius.pill,
                backgroundColor: colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AppText variant="bodyStrong" color="onPrimary">
                {name}
              </AppText>
              <Icon name="close" size={16} color={colors.onPrimary} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {ingredients.length === 0 ? (
        <View style={{ minHeight: 280 }}>
          <EmptyState
            title="Comece pelo que tem"
            message="Digite um ingrediente e toque em concluir. Pode separar vários por vírgula. Sal, água e óleo já contam como seus."
          />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="title3" accessibilityLiveRegion="polite">
              {results.length === 0
                ? 'Nenhuma receita'
                : `${results.length} ${results.length === 1 ? 'receita possível' : 'receitas possíveis'}`}
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => router.push('/comer/filtros')} style={{ minHeight: 44, justifyContent: 'center' }}>
              <AppText variant="bodyStrong" style={{ textDecorationLine: 'underline' }}>
                Filtrar
              </AppText>
            </Pressable>
          </View>
          {results.map(({ recipe, have, missing, total }) => (
            <Pressable
              key={recipe.id}
              accessibilityRole="button"
              accessibilityLabel={`${recipe.name}, ${recipe.minutes} minutos. Você tem ${have.length} de ${total}. ${describeMissing(missing)}`}
              onPress={() => router.push({ pathname: '/comer/receita/[id]', params: { id: recipe.id } })}
            >
              <AppCard>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                  <AppText variant="bodyStrong" style={{ flex: 1 }}>
                    {recipe.name}
                  </AppText>
                  <AppText variant="small" color="textMuted">
                    {recipe.minutes} min
                  </AppText>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceStrong, overflow: 'hidden' }}>
                  <View style={{ width: `${(have.length / total) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
                </View>
                <AppText variant="small" color="textMuted">
                  Você tem {have.length} de {total}. {describeMissing(missing)}
                </AppText>
              </AppCard>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

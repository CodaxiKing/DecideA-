import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Platform, Pressable, View } from 'react-native';

import { AppText, EmptyState, Icon, Screen } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { findRecipe } from './recipes';

/**
 * Como vai ser: fazer em casa ou procurar onde pedir. Não há parceiros de
 * delivery contratados, então nada aqui é patrocinado: só a busca no mapa do
 * próprio celular. Links de parceiros entram só com contrato e com aviso de
 * patrocínio (seção 2, decisão 11).
 */
export function WhereToOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const recipe = findRecipe(id);
  if (!recipe) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Receita não encontrada" message="Volte e escolha outra." />
      </Screen>
    );
  }

  const query = encodeURIComponent(`${recipe.name.split(' ').slice(0, 2).join(' ')} restaurante`);
  const mapsUrl = Platform.OS === 'ios' ? `maps://?q=${query}` : `geo:0,0?q=${query}`;

  const option = (title: string, text: string, onPress: () => void, primary = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${text}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 72,
        padding: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: primary ? colors.primary : colors.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" color={primary ? 'onPrimary' : 'text'}>
          {title}
        </AppText>
        <AppText variant="small" color={primary ? 'onPrimary' : 'textMuted'}>
          {text}
        </AppText>
      </View>
      <Icon name="chevron" color={primary ? colors.onPrimary : colors.text} />
    </Pressable>
  );

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.md }}>
      <Stack.Screen options={{ title: '' }} />
      <AppText variant="title1">{recipe.name}</AppText>
      <AppText variant="title3">Como vai ser?</AppText>
      {option('Fazer em casa', `Receita completa · ${recipe.minutes} min`, () => router.push({ pathname: '/comer/receita/[id]', params: { id: recipe.id } }), true)}
      {option('Procurar restaurantes por perto', 'Abre o mapa do seu celular', () => {
        Linking.openURL(mapsUrl).catch(() => Linking.openURL(`https://www.google.com/maps/search/${query}`));
      })}
      <AppText variant="small" color="textMuted">
        Ainda não temos parceiros de delivery. Quando houver, os links aparecem aqui marcados como patrocinados.
      </AppText>
    </Screen>
  );
}

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, Share, View } from 'react-native';

import { AppButton, AppText, EmptyState, Icon, Screen } from '../../components/ui';
import { useFoodStore } from '../../stores/foodStore';
import { useKitchenStore } from '../../stores/kitchenStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { findRecipe } from './recipes';
import { buildShoppingList, shoppingListText, type ShoppingItem } from './shopping';

/** Lista de compras de uma receita (`ids=a`) ou da semana (`ids=a,b,c`). */
export function ShoppingListScreen() {
  const { ids, title } = useLocalSearchParams<{ ids?: string; title?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const have = useFoodStore((s) => s.ingredients);
  const checked = useKitchenStore((s) => s.checked);
  const toggle = useKitchenStore((s) => s.toggleChecked);
  const list = (ids ?? '').split(',').flatMap((id) => findRecipe(id) ?? []);

  if (list.length === 0) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Nada para comprar" message="Escolha uma receita ou monte o cardápio da semana." />
      </Screen>
    );
  }

  const items = buildShoppingList(list, have).map((i) => ({ ...i, have: i.have || !!checked[i.key] }));
  const missing = items.filter((i) => !i.have);
  const owned = items.filter((i) => i.have);
  const name = title ?? (list.length === 1 ? list[0].name : 'Cardápio da semana');
  const text = shoppingListText(name, items);

  const sendWhatsApp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    if (await Linking.canOpenURL(url).catch(() => false)) Linking.openURL(url).catch(() => Share.share({ message: text }));
    else Share.share({ message: text }).catch(() => {});
  };

  const row = (i: ShoppingItem) => (
    <Pressable
      key={i.key}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: i.have }}
      accessibilityLabel={`${i.name}, ${i.quantity}`}
      onPress={() => toggle(i.key)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: i.have ? colors.primary : colors.textMuted,
          backgroundColor: i.have ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {i.have ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" style={i.have ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}>
          {i.name}
        </AppText>
        {list.length > 1 ? (
          <AppText variant="small" color="textMuted" numberOfLines={1}>
            {i.recipes.join(', ')}
          </AppText>
        ) : null}
      </View>
      <AppText variant="small" color="textMuted" style={{ maxWidth: '40%', textAlign: 'right' }}>
        {i.quantity}
      </AppText>
    </Pressable>
  );

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Lista de compras' }} />
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg }}>
        <AppText variant="title3">{name}</AppText>
        <AppText variant="small" color="textMuted">
          {list.length === 1 ? `${list[0].servings} porções` : `${list.length} receitas`} · toque para marcar o que já tem
        </AppText>
      </View>
      <View>
        <AppText variant="smallStrong" accessibilityRole="header">
          Falta comprar · {missing.length}
        </AppText>
        {missing.length ? missing.map(row) : <AppText color="textMuted">Você já tem tudo!</AppText>}
      </View>
      {owned.length ? (
        <View>
          <AppText variant="smallStrong" color="textMuted" accessibilityRole="header">
            Você já tem
          </AppText>
          {owned.map(row)}
        </View>
      ) : null}
      <AppButton label="Enviar pelo WhatsApp" onPress={sendWhatsApp} disabled={!missing.length} fullWidth />
      {list.length === 1 ? <AppButton label="Montar o cardápio da semana" variant="ghost" onPress={() => router.push('/cardapio')} fullWidth /> : null}
    </Screen>
  );
}

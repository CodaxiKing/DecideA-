import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';

import { AppBadge, AppButton, AppCard, AppText, Screen } from '../../components/ui';
import { PurchaseCancelledError, subscriptions, type SubscriptionProduct } from '../../services/subscriptions';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { FREE_LIMITS, PREMIUM_LIMITS } from './plans';
import { usePremium, usePremiumStore } from './usePremium';

const premiumPerks = [
  'Roletas e favoritos ilimitados',
  'Histórico completo',
  `Salas com até ${PREMIUM_LIMITS.roomSize} pessoas, abertas por 2 horas`,
  'Preferências e filtros salvos (em breve)',
];
const freePerks = [
  `${FREE_LIMITS.wheels} roletas salvas e ${FREE_LIMITS.favorites} favoritos`,
  `Histórico das ${FREE_LIMITS.historyVisible} últimas decisões`,
  `Salas com até ${FREE_LIMITS.roomSize} pessoas por 30 minutos`,
];

export function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isPremium, status } = usePremium();
  const [products, setProducts] = useState<SubscriptionProduct[] | null>(null);
  const [selected, setSelected] = useState<string>();
  const [busy, setBusy] = useState(false);
  const available = subscriptions.mode === 'store';

  useEffect(() => {
    let alive = true;
    subscriptions
      .getProducts()
      .then((list) => {
        if (!alive) return;
        setProducts(list);
        setSelected(list.find((p) => p.period === 'annual')?.packageId ?? list[0]?.packageId);
      })
      .catch(() => alive && setProducts([]));
    return () => {
      alive = false;
    };
  }, []);

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const s = await subscriptions.purchase(selected);
      usePremiumStore.getState().set(s);
      if (s.isPremium) {
        Alert.alert('Premium ativo', 'Obrigado! Os recursos Premium já estão liberados.');
        router.back();
      }
    } catch (e) {
      if (!(e instanceof PurchaseCancelledError)) Alert.alert('A compra não foi concluída', 'Nada foi cobrado. Tente de novo em instantes.');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      const s = await subscriptions.restore();
      usePremiumStore.getState().set(s);
      Alert.alert(s.isPremium ? 'Assinatura restaurada' : 'Nenhuma assinatura encontrada', s.isPremium ? 'O Premium está ativo neste aparelho.' : 'Não achamos uma assinatura ativa para esta conta da loja.');
    } catch {
      Alert.alert('Não deu para restaurar', 'Confira a internet e tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: '' }} />
      <View style={{ height: 200, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end', padding: spacing.lg, backgroundColor: colors.primary }}>
        <Image source={require('../../../assets/images/movies/piquenique.jpg')} accessibilityLabel="Casal num piquenique" style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', backgroundColor: 'rgba(10,6,24,0.55)' }} />
        <AppText variant="title1" style={{ color: '#FFFFFF' }}>
          Decidam melhor juntos
        </AppText>
      </View>

      {isPremium ? (
        <AppCard>
          <AppText variant="title3">Você é Premium</AppText>
          <AppText variant="small" color="textMuted">
            {status.expiresAt ? `${status.willRenew ? 'Renova' : 'Vale até'} ${new Date(status.expiresAt).toLocaleDateString('pt-BR')}.` : 'Assinatura ativa.'} Gerencie ou cancele na loja.
          </AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title3">Gratuito</AppText>
          <AppText variant="title3">R$ 0</AppText>
        </View>
        {freePerks.map((p) => (
          <AppText key={p} variant="small">
            • {p}
          </AppText>
        ))}
      </AppCard>

      <AppCard style={{ backgroundColor: colors.primary }}>
        <AppText variant="title3" color="onPrimary">
          Premium
        </AppText>
        {premiumPerks.map((p) => (
          <AppText key={p} variant="small" color="onPrimary">
            • {p}
          </AppText>
        ))}
      </AppCard>

      {available && products && products.length > 0 ? (
        <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
          {products.map((p) => (
            <Pressable
              key={p.packageId}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected === p.packageId }}
              onPress={() => setSelected(p.packageId)}
              style={{
                borderRadius: radius.md,
                padding: spacing.lg,
                borderWidth: 2,
                borderColor: selected === p.packageId ? colors.primary : colors.surfaceStrong,
                flexDirection: 'row',
                justifyContent: 'space-between',
                minHeight: 56,
              }}
            >
              <AppText variant="bodyStrong">{p.period === 'annual' ? 'Anual' : p.period === 'monthly' ? 'Mensal' : p.title}</AppText>
              <AppText variant="bodyStrong">{p.priceText}</AppText>
            </Pressable>
          ))}
        </View>
      ) : (
        <AppCard>
          <AppBadge label="Loja indisponível" tone="strong" />
          <AppText variant="small" color="textMuted">
            {subscriptions.unavailableReason ?? 'Os planos ainda não foram publicados na loja.'} Enquanto isso, tudo do plano grátis funciona normalmente.
          </AppText>
        </AppCard>
      )}

      <AppCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="title3">Premium Dupla</AppText>
          <AppBadge label="Em breve" />
        </View>
        <AppText variant="small" color="textMuted">
          Tudo do Premium para duas pessoas conectadas. Chega depois de confirmarmos as regras das lojas para assinaturas compartilhadas.
        </AppText>
      </AppCard>

      {!isPremium ? (
        <AppButton label={busy ? 'Aguarde…' : 'Assinar Premium'} onPress={buy} disabled={!available || !selected || busy} fullWidth />
      ) : null}
      <AppText variant="small" color="textMuted" style={{ textAlign: 'center' }}>
        Renova sozinho. Cancele quando quiser na loja. Se expirar, o app continua no plano grátis.
      </AppText>
      <AppButton label="Restaurar compras" variant="ghost" size="sm" onPress={restore} disabled={!available || busy} fullWidth />
    </Screen>
  );
}

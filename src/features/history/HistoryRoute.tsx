import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppBadge, AppCard, AppText } from '../../components/ui';
import { useHistoryStore } from '../../stores/historyStore';
import { usePremium } from '../premium/usePremium';
import { HistoryScreen } from './HistoryScreen';

/** Histórico com o limite do plano: o grátis mostra as últimas decisões. */
export function HistoryRoute() {
  const router = useRouter();
  const { isPremium, limits } = usePremium();
  const total = useHistoryStore((s) => s.entries.length);
  const footer =
    !isPremium && total > 0 ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`O plano grátis mostra as ${limits.historyVisible} últimas decisões. Ver Premium`}
        onPress={() => router.push('/premium')}
      >
        <AppCard style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <AppText variant="small">O plano grátis mostra as {limits.historyVisible} últimas decisões.</AppText>
          </View>
          <AppBadge label="Premium" tone="strong" />
        </AppCard>
      </Pressable>
    ) : null;
  return <HistoryScreen visibleLimit={isPremium ? undefined : limits.historyVisible} footer={footer} />;
}

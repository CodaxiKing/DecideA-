import { Stack } from 'expo-router';
import { View } from 'react-native';

import { AppText, BrandMark, EmptyState, Screen, ShareableResult } from '../../components/ui';
import { useHistoryStore } from '../../stores/historyStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { monthRetrospective } from './insights';

export function RetrospectiveScreen() {
  const { colors } = useTheme();
  const entries = useHistoryStore((s) => s.entries);
  const r = monthRetrospective(entries);

  if (r.total === 0) {
    return (
      <Screen scroll={false} edges={[]}>
        <Stack.Screen options={{ title: 'Retrospectiva' }} />
        <EmptyState title={`Seu ${r.monthLabel} ainda está em branco`} message="Decida alguma coisa e a retrospectiva começa a contar." />
      </Screen>
    );
  }

  const line = (text: string) => (
    <AppText variant="title3" color="onPrimary">
      {text}
    </AppText>
  );

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Retrospectiva' }} />
      <ShareableResult fallbackText={`Meu ${r.monthLabel} no DecideAí: ${r.total} decisões sem discussão!`} label="Compartilhar retrospectiva">
        <View style={{ backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <BrandMark size={22} />
            <AppText variant="bodyStrong" color="onPrimary">
              DecideAí
            </AppText>
          </View>
          <AppText variant="title2" color="onPrimary">
            Seu {r.monthLabel}
          </AppText>
          <AppText variant="display" color="onPrimary" style={{ fontSize: 72, lineHeight: 76 }}>
            {r.total}
          </AppText>
          {line(r.total === 1 ? 'decisão sem discussão' : 'decisões sem discussão')}
          {r.topTag && r.topTag.count > 1 ? line(`${r.topTag.label} ganhou ${r.topTag.count} vezes`) : null}
          {r.topItem && r.topItem.count > 1 ? line(`${r.topItem.title} saiu ${r.topItem.count} vezes`) : null}
          {r.together ? line(`${r.together} ${r.together === 1 ? 'decisão' : 'decisões'} em grupo`) : null}
        </View>
      </ShareableResult>
    </Screen>
  );
}

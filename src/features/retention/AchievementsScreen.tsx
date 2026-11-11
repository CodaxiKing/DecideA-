import { Stack } from 'expo-router';
import { View } from 'react-native';

import { AppCard, AppText, Icon, Screen } from '../../components/ui';
import { useHistoryStore } from '../../stores/historyStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { achievements } from './insights';

export function AchievementsScreen() {
  const { colors } = useTheme();
  const entries = useHistoryStore((s) => s.entries);
  const list = achievements(entries);
  const done = list.filter((a) => a.done);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Conquistas' }} />
      <AppText color="textMuted">
        {done.length} de {list.length} conquistas. Sem sequência diária: cada marco fica com você.
      </AppText>
      {list.map((a) => (
        <AppCard key={a.id} accessible accessibilityLabel={`${a.title}. ${a.description}. ${a.done ? 'Conquistada' : `${a.progress} de ${a.goal}`}`} style={a.done ? { backgroundColor: colors.primary } : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {a.done ? <Icon name="check" color={colors.onPrimary} /> : null}
            <AppText variant="bodyStrong" color={a.done ? 'onPrimary' : 'text'} style={{ flex: 1 }}>
              {a.title}
            </AppText>
            <AppText variant="small" color={a.done ? 'onPrimary' : 'textMuted'}>
              {a.progress} de {a.goal}
            </AppText>
          </View>
          <AppText variant="small" color={a.done ? 'onPrimary' : 'textMuted'}>
            {a.description}
          </AppText>
          {!a.done ? (
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceStrong, overflow: 'hidden' }}>
              <View style={{ width: `${(a.progress / a.goal) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
            </View>
          ) : null}
        </AppCard>
      ))}
    </Screen>
  );
}

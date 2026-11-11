import { Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Icon, Screen, WheelArt } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { templateSummary, wheelTemplates } from './templates';

function Row({ title, subtitle, art, onPress }: { title: string; subtitle: string; art: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 68, opacity: pressed ? 0.7 : 1 })}
    >
      {art}
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="small" color="textMuted">
          {subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}

export function WheelTemplatesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const open = (template?: string) => router.push({ pathname: '/roleta/editar', params: template ? { template } : {} });

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.xs }}>
      <Stack.Screen options={{ title: 'Modelos prontos' }} />
      {wheelTemplates.map((t) => (
        <Row key={t.id} title={t.name} subtitle={templateSummary(t)} art={<WheelArt size={56} />} onPress={() => open(t.id)} />
      ))}
      <Row
        title="Pacotes temáticos"
        subtitle="Noite de terror, primeiro encontro e mais · Premium"
        art={
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="heart" color={colors.onPrimary} />
          </View>
        }
        onPress={() => router.push('/pacotes')}
      />
      <Row
        title="Roleta em branco"
        subtitle="Comece do zero"
        art={
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" color={colors.text} />
          </View>
        }
        onPress={() => open()}
      />
    </Screen>
  );
}

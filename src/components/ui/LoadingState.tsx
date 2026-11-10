import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export function LoadingState({ message = 'Carregando…' }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}
    >
      <ActivityIndicator color={colors.primary} size="large" />
      <AppText color="textMuted">{message}</AppText>
    </View>
  );
}

import { View, type ViewProps } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';

export function AppCard({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, gap: spacing.sm }, style]}
      {...rest}
    />
  );
}

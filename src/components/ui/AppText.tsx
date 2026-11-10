import { Text, type TextProps } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { typography, type ThemeColors, type TypographyVariant } from '../../theme/tokens';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof ThemeColors;
}

export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const isHeading = variant.startsWith('title') || variant === 'display';
  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      style={[typography[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}

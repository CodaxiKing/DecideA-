import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, typography } from '../../theme/tokens';
import { AppText } from './AppText';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

export interface AppButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  style,
  ...rest
}: AppButtonProps) {
  const { colors } = useTheme();
  const background =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.surface;
  const foreground =
    variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.background : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: background, opacity: disabled ? 0.55 : pressed ? 0.85 : 1 },
        fullWidth && styles.full,
        style,
      ]}
      {...rest}
    >
      <AppText
        style={[size === 'sm' ? typography.bodyStrong : styles.mdLabel, { color: foreground }]}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  md: { height: 56, paddingHorizontal: 24 },
  sm: { height: 48, paddingHorizontal: 18 },
  full: { alignSelf: 'stretch' },
  mdLabel: { ...typography.bodyStrong, fontSize: 17 },
});

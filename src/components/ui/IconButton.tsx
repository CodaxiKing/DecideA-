import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { minTouch } from '../../theme/tokens';
import { Icon, type IconName } from './Icon';

export interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  plain?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Botão só com ícone, 44×44, sempre com rótulo para leitores de tela. */
export function IconButton({ icon, label, onPress, plain, disabled, style }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: minTouch,
          height: minTouch,
          borderRadius: minTouch / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: plain ? 'transparent' : colors.surface,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} color={colors.text} />
    </Pressable>
  );
}

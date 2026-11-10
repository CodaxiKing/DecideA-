import { Pressable } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { minTouch, radius } from '../../theme/tokens';
import { AppText } from './AppText';

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Várias podem ficar marcadas ao mesmo tempo (checkbox em vez de radio). */
  multi?: boolean;
}

export function FilterChip({ label, selected, onPress, multi }: FilterChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        height: minTouch,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        justifyContent: 'center',
        backgroundColor: selected ? colors.primary : colors.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <AppText variant={selected ? 'bodyStrong' : 'body'} color={selected ? 'onPrimary' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/tokens';
import { AppText } from './AppText';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  compact?: boolean;
  /** Dentro de um cartão: usa a cor do fundo para o campo não sumir. */
  onSurface?: boolean;
}

export function AppInput({ label, error, compact, onSurface, style, accessibilityLabel, ...rest }: AppInputProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6, flexShrink: 1 }}>
      {label ? <AppText variant="smallStrong">{label}</AppText> : null}
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={colors.textMuted}
        style={[
          typography.body,
          {
            height: compact ? 48 : 56,
            borderRadius: 18,
            paddingHorizontal: 16,
            backgroundColor: onSurface ? colors.background : colors.surface,
            color: colors.text,
            borderWidth: error ? 2 : 0,
            borderColor: colors.danger,
          },
          style,
        ]}
        {...rest}
      />
      {error?.trim() ? (
        <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

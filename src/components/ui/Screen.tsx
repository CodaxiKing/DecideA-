import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}

/** Contêiner padrão de tela: fundo do tema, área segura e margem de 20 px. */
export function Screen({ children, scroll = true, edges = ['top'], contentStyle }: ScreenProps) {
  const { colors } = useTheme();
  const inner = [{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: 14 }, contentStyle];
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={inner}>{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

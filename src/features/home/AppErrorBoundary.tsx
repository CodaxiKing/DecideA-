import type { ErrorBoundaryProps } from 'expo-router';
import { Text, View } from 'react-native';

import { colors } from '../../theme/tokens';

/**
 * Tela de erro do Expo Router. Fica fora dos providers (tema, fontes), por isso usa
 * cores fixas e fonte do sistema. Não mostra detalhes técnicos para a pessoa.
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  if (__DEV__) console.error(error);
  const c = colors.light;
  return (
    <View style={{ flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: '700', color: c.text, textAlign: 'center' }}>
        Algo deu errado
      </Text>
      <Text style={{ fontSize: 16, color: c.textMuted, textAlign: 'center' }}>
        O app encontrou um problema nesta tela. Suas roletas, favoritos e histórico continuam guardados.
      </Text>
      <Text
        accessibilityRole="button"
        onPress={retry}
        style={{
          backgroundColor: c.primary,
          color: c.onPrimary,
          fontSize: 17,
          fontWeight: '600',
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderRadius: 28,
          overflow: 'hidden',
        }}
      >
        Tentar de novo
      </Text>
    </View>
  );
}

import * as Sharing from 'expo-sharing';
import { useRef, useState, type ReactNode } from 'react';
import { Platform, Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { BrandMark } from './BrandMark';

export interface ShareableResultProps {
  children: ReactNode;
  /** Texto usado quando não dá para compartilhar imagem (web ou falha). */
  fallbackText: string;
  label?: string;
}

/**
 * Envolve o cartão de resultado e oferece "Compartilhar imagem": gera uma imagem
 * com a marca do DecideAí, pronta para o WhatsApp ou o Instagram.
 */
export function ShareableResult({ children, fallbackText, label = 'Compartilhar imagem' }: ShareableResultProps) {
  const { colors } = useTheme();
  const shot = useRef<React.ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);

  const share = async () => {
    setBusy(true);
    try {
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync()) && shot.current) {
        // Os tipos do view-shot ainda não conhecem o View do React Native 0.88.
        const uri = await captureRef(shot as never, { format: 'png', quality: 1, result: 'tmpfile' });
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar resultado' });
      } else {
        await Share.share({ message: fallbackText });
      }
    } catch {
      await Share.share({ message: fallbackText }).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View ref={shot} collapsable={false} style={{ backgroundColor: colors.background, padding: spacing.sm, gap: spacing.md }}>
          {children}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingBottom: spacing.xs }}>
            <BrandMark size={20} />
            <AppText variant="smallStrong">Decidido no DecideAí</AppText>
          </View>
      </View>
      <AppButton label={busy ? 'Preparando…' : label} variant="ghost" onPress={share} disabled={busy} fullWidth />
    </View>
  );
}

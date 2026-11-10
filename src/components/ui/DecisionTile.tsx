import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/tokens';
import { AppText } from './AppText';

type Tone = 'primary' | 'blue' | 'lilac' | 'surface';

const toneColors: Record<Tone, { bg: keyof ThemeColors; fg: keyof ThemeColors }> = {
  primary: { bg: 'primary', fg: 'onPrimary' },
  blue: { bg: 'blue', fg: 'onBlue' },
  lilac: { bg: 'lilac', fg: 'onLilac' },
  surface: { bg: 'surface', fg: 'text' },
};

export interface DecisionTileProps {
  title: string;
  subtitle: string;
  tone: Tone;
  onPress: () => void;
  image?: ImageSourcePropType;
  art?: ReactNode;
}

/** Cartão grande de ferramenta da tela inicial. */
export function DecisionTile({ title, subtitle, tone, onPress, image, art }: DecisionTileProps) {
  const { colors } = useTheme();
  const { bg, fg } = toneColors[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: colors[bg], opacity: pressed ? 0.9 : 1 }]}
    >
      {image ? (
        <>
          <Image source={image} style={styles.photo} resizeMode="cover" />
          {/* Degradê da cor do cartão para a foto, sem emenda reta. */}
          <LinearGradient
            colors={[colors[bg], withAlpha(colors[bg], 0)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fade}
            pointerEvents="none"
          />
        </>
      ) : null}
      {art ? <View style={styles.art}>{art}</View> : null}
      <View style={styles.copy}>
        <AppText variant="title2" color={fg}>
          {title}
        </AppText>
        <AppText color={fg}>{subtitle}</AppText>
      </View>
    </Pressable>
  );
}

/** "#5A2BE0" + alpha → "rgba(90,43,224,a)". */
function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const PHOTO_WIDTH = 136;
const FADE_WIDTH = 64;

const styles = StyleSheet.create({
  tile: { height: 132, borderRadius: 30, padding: 20, overflow: 'hidden' },
  photo: { position: 'absolute', right: 0, top: 0, bottom: 0, width: PHOTO_WIDTH },
  fade: { position: 'absolute', top: 0, bottom: 0, right: PHOTO_WIDTH - FADE_WIDTH, width: FADE_WIDTH },
  art: { position: 'absolute', right: -30, top: -22 },
  copy: { maxWidth: 186, gap: 4 },
});

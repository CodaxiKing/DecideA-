import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/tokens';
import { AppText } from './AppText';

type Tone = 'primary' | 'blue' | 'lilac';

const toneColors: Record<Tone, { bg: keyof ThemeColors; fg: keyof ThemeColors }> = {
  primary: { bg: 'primary', fg: 'onPrimary' },
  blue: { bg: 'blue', fg: 'onBlue' },
  lilac: { bg: 'lilac', fg: 'onLilac' },
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
      {image ? <Image source={image} style={styles.photo} resizeMode="cover" /> : null}
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

const styles = StyleSheet.create({
  tile: { height: 132, borderRadius: 30, padding: 20, overflow: 'hidden' },
  photo: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 136 },
  art: { position: 'absolute', right: -30, top: -22 },
  copy: { maxWidth: 186, gap: 4 },
});

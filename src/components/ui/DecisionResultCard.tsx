import type { ReactNode } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export interface DecisionResultCardProps {
  eyebrow?: string;
  title: string;
  caption?: string;
  image?: ImageSourcePropType;
  children?: ReactNode;
}

/**
 * Cartão de resultado com a marca do DecideAí: o ponteiro da roleta cai sobre ele.
 */
export function DecisionResultCard({ eyebrow = 'Deu', title, caption, image, children }: DecisionResultCardProps) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${eyebrow} ${title}${caption ? `. ${caption}` : ''}`}
      style={{ backgroundColor: colors.primary, borderRadius: radius.lg, paddingTop: 44, padding: spacing.xl, gap: spacing.md }}
    >
      <Svg width={40} height={30} style={{ position: 'absolute', top: -2, alignSelf: 'center', zIndex: 1 }}>
        <Path d="M0 0H40L20 30Z" fill={colors.background} />
      </Svg>
      {image ? (
        <Image
          source={image}
          resizeMode="cover"
          style={{ width: '100%', height: 180, borderRadius: 20, marginTop: -20 }}
        />
      ) : null}
      <AppText color="onPrimary">{eyebrow}</AppText>
      <AppText variant={title.length > 36 ? 'title2' : title.length > 18 ? 'title1' : 'display'} color="onPrimary" numberOfLines={4}>
        {title}
      </AppText>
      {caption ? <AppText color="onPrimary">{caption}</AppText> : null}
      {children}
    </View>
  );
}

import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export interface DecisionResultCardProps {
  eyebrow?: string;
  title: string;
  caption?: string;
  children?: ReactNode;
}

/**
 * Cartão de resultado com a marca do DecideAí: o ponteiro da roleta cai sobre ele.
 */
export function DecisionResultCard({ eyebrow = 'Deu', title, caption, children }: DecisionResultCardProps) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${eyebrow} ${title}${caption ? `. ${caption}` : ''}`}
      style={{ backgroundColor: colors.primary, borderRadius: radius.lg, paddingTop: 44, padding: spacing.xl, gap: spacing.md }}
    >
      <Svg width={40} height={30} style={{ position: 'absolute', top: -2, alignSelf: 'center' }}>
        <Path d="M0 0H40L20 30Z" fill={colors.background} />
      </Svg>
      <AppText color="onPrimary">{eyebrow}</AppText>
      <AppText variant="display" color="onPrimary" adjustsFontSizeToFit numberOfLines={2}>
        {title}
      </AppText>
      {caption ? <AppText color="onPrimary">{caption}</AppText> : null}
      {children}
    </View>
  );
}

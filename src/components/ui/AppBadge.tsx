import { View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { radius } from '../../theme/tokens';
import { AppText } from './AppText';

export interface AppBadgeProps {
  label: string;
  tone?: 'soft' | 'strong';
}

export function AppBadge({ label, tone = 'soft' }: AppBadgeProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 28,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        justifyContent: 'center',
        alignSelf: 'flex-start',
        backgroundColor: tone === 'strong' ? colors.text : colors.primarySoft,
      }}
    >
      <AppText variant="label" color={tone === 'strong' ? 'background' : 'text'}>
        {label}
      </AppText>
    </View>
  );
}

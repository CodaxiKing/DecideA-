import type { ReactNode } from 'react';
import { View } from 'react-native';

import { spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
  illustration?: ReactNode;
}

export function EmptyState({ title, message, action, illustration }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }}>
      {illustration}
      <AppText variant="title2" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText color="textMuted" style={{ textAlign: 'center', maxWidth: 300 }}>
        {message}
      </AppText>
      {action}
    </View>
  );
}

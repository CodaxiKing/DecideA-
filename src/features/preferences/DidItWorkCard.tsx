import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton, AppCard, AppText, Icon, IconButton } from '../../components/ui';
import { useHistoryStore, type DecisionFeedback } from '../../stores/historyStore';
import { usePreferenceSignals } from '../../stores/preferenceSignalsStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { formatDayLabel } from '../../utils/dates';
import { asSignalKind, feedbackSignal, pendingFeedback } from './feedback';

const options: { value: DecisionFeedback; label: string }[] = [
  { value: 'liked', label: 'Gostamos' },
  { value: 'meh', label: 'Mais ou menos' },
  { value: 'skipped', label: 'Não fizemos' },
];

/** "Deu certo?" depois de uma decisão. Alimenta a memória de preferências. */
export function DidItWorkCard() {
  const { colors } = useTheme();
  const entry = useHistoryStore((s) => pendingFeedback(s.entries));
  const [choice, setChoice] = useState<DecisionFeedback>();
  if (!entry) return null;

  const answer = (feedback: DecisionFeedback) => {
    useHistoryStore.getState().setFeedback(entry.id, feedback);
    const kind = asSignalKind(entry.kind);
    const signal = feedbackSignal(feedback);
    if (kind && signal && entry.refId) usePreferenceSignals.getState().record(kind, entry.refId, signal.outcome, signal.amount);
    setChoice(undefined);
  };

  return (
    <AppCard style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppText variant="small" color="textMuted">
            {formatDayLabel(entry.createdAt)} vocês decidiram
          </AppText>
          <AppText variant="title3">{entry.title}</AppText>
        </View>
        <IconButton icon="close" label="Fechar sem responder" plain onPress={() => answer('dismissed')} />
      </View>
      <AppText variant="bodyStrong">Deu certo?</AppText>
      <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
        {options.map((o) => {
          const on = choice === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setChoice(o.value)}
              style={{
                minHeight: 48,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: on ? colors.primary : colors.background,
              }}
            >
              <AppText variant="bodyStrong" color={on ? 'onPrimary' : 'text'} style={{ flex: 1 }}>
                {o.label}
              </AppText>
              {on ? <Icon name="check" color={colors.onPrimary} /> : null}
            </Pressable>
          );
        })}
      </View>
      <AppText variant="small" color="textMuted">
        Isso melhora as próximas sugestões.
      </AppText>
      <AppButton label="Enviar" size="sm" disabled={!choice} onPress={() => choice && answer(choice)} />
    </AppCard>
  );
}

import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText, EmptyState, FilterChip, Icon, Screen, WheelArt } from '../../components/ui';
import { useHistoryStore, type DecisionKind } from '../../stores/historyStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { formatTime } from '../../utils/dates';
import { groupHistory, type HistoryFilter } from './groupHistory';

const filters: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'food', label: 'Comida' },
  { value: 'movie', label: 'Filmes' },
  { value: 'wheel', label: 'Roleta' },
];

function KindArt({ kind }: { kind: DecisionKind }) {
  const { colors } = useTheme();
  if (kind === 'wheel') return <WheelArt size={52} />;
  return (
    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={kind === 'food' ? 'food' : 'film'} color={colors.text} />
    </View>
  );
}

export interface HistoryScreenProps {
  /** Quantas decisões mostrar. Indefinido = todas. */
  visibleLimit?: number;
  footer?: React.ReactNode;
}

export function HistoryScreen({ visibleLimit, footer }: HistoryScreenProps) {
  const entries = useHistoryStore((s) => s.entries);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const visible = visibleLimit === undefined ? entries : entries.slice(0, visibleLimit);
  const sections = groupHistory(visible, filter);

  return (
    <Screen>
      <AppText variant="title1">Histórico</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
          {filters.map((f) => (
            <FilterChip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </View>
      </ScrollView>
      {sections.length === 0 ? (
        <View style={{ minHeight: 320 }}>
          <EmptyState
            title="Nada por aqui ainda"
            message={
              entries.length === 0
                ? 'Gire uma roleta ou sorteie uma comida e a decisão aparece aqui.'
                : 'Nenhuma decisão desse tipo.'
            }
          />
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.label} style={{ gap: spacing.xs }}>
            <AppText variant="smallStrong" color="textMuted" accessibilityRole="header">
              {section.label}
            </AppText>
            {section.entries.map((entry) => (
              <View
                key={entry.id}
                accessible
                accessibilityLabel={`${entry.title}, ${entry.source}, ${formatTime(entry.createdAt)}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 68 }}
              >
                <KindArt kind={entry.kind} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{entry.title}</AppText>
                  <AppText variant="small" color="textMuted">
                    {entry.source} · {formatTime(entry.createdAt)}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
      {footer}
    </Screen>
  );
}

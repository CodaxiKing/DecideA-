import type { DecisionEntry, DecisionKind } from '../../stores/historyStore';
import { formatDayLabel } from '../../utils/dates';

export type HistoryFilter = 'all' | DecisionKind;

export interface HistorySection {
  label: string;
  entries: DecisionEntry[];
}

/** Filtra por tipo e agrupa por dia ("Hoje", "Ontem"...), mantendo a ordem mais recente primeiro. */
export function groupHistory(entries: DecisionEntry[], filter: HistoryFilter, now: Date = new Date()): HistorySection[] {
  const sections: HistorySection[] = [];
  for (const entry of entries) {
    if (filter !== 'all' && entry.kind !== filter) continue;
    const label = formatDayLabel(entry.createdAt, now);
    const last = sections[sections.length - 1];
    if (last && last.label === label) last.entries.push(entry);
    else sections.push({ label, entries: [entry] });
  }
  return sections;
}

import { useHistoryStore } from '../../stores/historyStore';
import { usePreferenceSignals } from '../../stores/preferenceSignalsStore';
import { usePremiumStore } from '../premium/usePremium';
import { recentDecisions, signalKey, weightFor, weightedPick, withoutRecent, type SignalKind } from './engine';

/**
 * Sorteio com memória: tira o que saiu há pouco (todos os planos) e pesa pelo
 * que a pessoa aceita ou recusa (Premium: "preferências inteligentes").
 */
export function smartPick<T>(kind: SignalKind, pool: readonly T[], getId: (item: T) => string, alsoAvoid?: string): T | undefined {
  const prefs = usePreferenceSignals.getState();
  let candidates = [...pool];
  if (alsoAvoid && candidates.length > 1) candidates = candidates.filter((i) => getId(i) !== alsoAvoid);
  if (prefs.avoidRepeats) {
    const recent = recentDecisions(useHistoryStore.getState().entries, kind, prefs.repeatDays);
    candidates = withoutRecent(candidates, getId, recent);
  }
  const smart = prefs.learn && usePremiumStore.getState().status.isPremium;
  return weightedPick(candidates, (i) => (smart ? weightFor(prefs.signals[signalKey(kind, getId(i))]) : 1));
}

/** Ordena uma lista pelo gosto aprendido (Premium), mantendo aleatoriedade entre iguais. */
export function sortByPreference<T>(kind: SignalKind, items: readonly T[], getId: (item: T) => string): T[] {
  const prefs = usePreferenceSignals.getState();
  if (!prefs.learn || !usePremiumStore.getState().status.isPremium) return [...items];
  return [...items]
    .map((item, index) => ({ item, index, w: weightFor(prefs.signals[signalKey(kind, getId(item))]) }))
    .sort((a, b) => b.w - a.w || a.index - b.index)
    .map((x) => x.item);
}

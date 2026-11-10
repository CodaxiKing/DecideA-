import { useActivityStore } from '../../stores/activityStore';
import { useHistoryStore } from '../../stores/historyStore';
import { usePreferenceSignals } from '../../stores/preferenceSignalsStore';
import { smartPick } from '../preferences/smartPick';
import { activities, matchesActivity, timeOfDay, type Activity, type ActivityFilters } from './catalog';

/**
 * Sugestão por contexto: entre as atividades que passam nos filtros, prefere as
 * que combinam com a hora do dia. Se nenhuma combina, usa todas.
 */
export function activityPool(filters: ActivityFilters, now: Date = new Date()): Activity[] {
  const matching = activities.filter((a) => matchesActivity(a, filters));
  const tod = timeOfDay(now);
  const forNow = matching.filter((a) => a.times.includes(tod));
  return forNow.length ? forNow : matching;
}

/** Sorteia uma atividade, registra no histórico e devolve (ou nada, se não houver). */
export function drawActivity(again = false): Activity | undefined {
  const { filters, lastDrawnId, setLastDrawn } = useActivityStore.getState();
  if (again && lastDrawnId) usePreferenceSignals.getState().record('activity', lastDrawnId, 'reject');
  const pick = smartPick('activity', activityPool(filters), (a) => a.id, lastDrawnId);
  if (!pick) return undefined;
  setLastDrawn(pick.id);
  useHistoryStore.getState().addEntry({ kind: 'activity', title: pick.name, source: 'O Que Fazer?', refId: pick.id });
  return pick;
}

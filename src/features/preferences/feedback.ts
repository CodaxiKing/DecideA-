import type { DecisionEntry, DecisionFeedback } from '../../stores/historyStore';
import type { SignalKind } from './engine';

const DAY = 86400000;

/** Decisão que ainda merece a pergunta "Deu certo?": recente, de um item e sem resposta. */
export function pendingFeedback(entries: readonly DecisionEntry[], now: Date = new Date()): DecisionEntry | undefined {
  return entries.find(
    (e) =>
      (e.kind === 'food' || e.kind === 'movie' || e.kind === 'activity') &&
      !!e.refId &&
      !e.feedback &&
      now.getTime() - new Date(e.createdAt).getTime() < 3 * DAY,
  );
}

/** Quanto cada resposta pesa na memória de preferências. */
export function feedbackSignal(feedback: DecisionFeedback): { outcome: 'accept' | 'reject'; amount: number } | null {
  if (feedback === 'liked') return { outcome: 'accept', amount: 2 };
  if (feedback === 'meh') return { outcome: 'reject', amount: 1 };
  return null; // "não fizemos" e fechar sem responder não dizem nada sobre o gosto
}

export function asSignalKind(kind: DecisionEntry['kind']): SignalKind | null {
  return kind === 'food' || kind === 'movie' || kind === 'activity' ? kind : null;
}

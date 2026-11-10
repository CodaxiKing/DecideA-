import { cryptoSource, randomFraction, type RandomSource } from '../../utils/random';

export type SignalKind = 'food' | 'movie' | 'activity';

export interface PreferenceSignal {
  kind: SignalKind;
  id: string;
  accepted: number;
  rejected: number;
  updatedAt: string;
}

export const signalKey = (kind: SignalKind, id: string) => `${kind}:${id}`;

/** Peso de sorteio de um item: aceitar aumenta, recusar diminui, sem nunca zerar. */
export function weightFor(signal: Pick<PreferenceSignal, 'accepted' | 'rejected'> | undefined): number {
  if (!signal) return 1;
  return Math.min(4, Math.max(0.15, 1 + 0.5 * signal.accepted - 0.35 * signal.rejected));
}

/** Sorteio ponderado. Com todos os pesos iguais, é um sorteio uniforme. */
export function weightedPick<T>(items: readonly T[], weight: (item: T) => number, source: RandomSource = cryptoSource): T | undefined {
  if (items.length === 0) return undefined;
  const weights = items.map((i) => Math.max(0, weight(i)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(randomFraction(source) * items.length)];
  let r = randomFraction(source) * total;
  for (let k = 0; k < items.length; k++) {
    r -= weights[k];
    if (r < 0) return items[k];
  }
  return items[items.length - 1];
}

const DAY = 86400000;

/** Itens decididos nos últimos `days` dias (id → data mais recente). */
export function recentDecisions(
  entries: readonly { kind: string; refId?: string; createdAt: string }[],
  kind: string,
  days: number,
  now: Date = new Date(),
): Map<string, string> {
  const since = now.getTime() - days * DAY;
  const out = new Map<string, string>();
  for (const e of entries) {
    if (e.kind !== kind || !e.refId) continue;
    if (new Date(e.createdAt).getTime() < since) continue;
    const prev = out.get(e.refId);
    if (!prev || e.createdAt > prev) out.set(e.refId, e.createdAt);
  }
  return out;
}

/**
 * Tira do sorteio o que saiu há pouco. Se isso esvaziar a lista (catálogo pequeno),
 * relaxa a regra em vez de não sugerir nada.
 */
export function withoutRecent<T>(pool: readonly T[], getId: (item: T) => string, recent: ReadonlySet<string> | Map<string, string>): T[] {
  const fresh = pool.filter((i) => !recent.has(getId(i)));
  return fresh.length > 0 ? fresh : [...pool];
}

/** Dias até um item voltar a ser sugerido. */
export function daysUntilBack(decidedAt: string, days: number, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(decidedAt).getTime() + days * DAY - now.getTime()) / DAY));
}

/**
 * Agrupa sinais por etiqueta (categoria, gênero) para mostrar o que a pessoa
 * costuma aceitar e recusar.
 */
export function learnedTags(
  signals: readonly PreferenceSignal[],
  tagsOf: (s: PreferenceSignal) => string[],
): { liked: string[]; disliked: string[] } {
  const score = new Map<string, number>();
  for (const s of signals) {
    const delta = s.accepted - s.rejected;
    if (delta === 0) continue;
    for (const t of tagsOf(s)) score.set(t, (score.get(t) ?? 0) + delta);
  }
  const sorted = [...score.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  return {
    liked: sorted.filter(([, v]) => v >= 2).map(([t]) => t).slice(0, 8),
    disliked: sorted.filter(([, v]) => v <= -2).map(([t]) => t).slice(0, 8),
  };
}

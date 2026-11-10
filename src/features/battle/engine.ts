import { cryptoSource, type RandomSource } from '../../utils/random';
import { shuffle } from '../../utils/shuffle';

/**
 * Batalha de opções: duelos de duas em duas, as vencedoras avançam até sobrar uma.
 * Com quantidade ímpar numa rodada, uma opção sorteada avança direto ("passa de fase").
 */
export interface Battle {
  /** Opções que disputam a rodada atual, na ordem dos duelos. */
  current: string[];
  /** Vencedoras da rodada atual. */
  next: string[];
  /** Posição do duelo atual em `current`. */
  index: number;
  round: number;
  /** Quem passou direto em cada rodada. */
  byes: string[];
  duelsDone: number;
  totalDuels: number;
  winner?: string;
  total: number;
}

function withBye(list: string[], byes: string[]): { duel: string[]; carry: string[]; byes: string[] } {
  if (list.length % 2 === 0) return { duel: list, carry: [], byes };
  const bye = list[list.length - 1];
  return { duel: list.slice(0, -1), carry: [bye], byes: [...byes, bye] };
}

export function startBattle(ids: string[], source: RandomSource = cryptoSource): Battle {
  if (ids.length < 2) throw new RangeError('a batalha precisa de pelo menos 2 opções');
  const shuffled = shuffle(ids, source);
  const { duel, carry, byes } = withBye(shuffled, []);
  return { current: duel, next: carry, index: 0, round: 1, byes, duelsDone: 0, totalDuels: ids.length - 1, total: ids.length };
}

export function currentDuel(b: Battle): [string, string] | null {
  if (b.winner) return null;
  return [b.current[b.index], b.current[b.index + 1]];
}

export function choose(b: Battle, winnerId: string): Battle {
  const duel = currentDuel(b);
  if (!duel || !duel.includes(winnerId)) return b;
  const next = [...b.next, winnerId];
  const index = b.index + 2;
  const duelsDone = b.duelsDone + 1;
  if (index < b.current.length) return { ...b, next, index, duelsDone };
  if (next.length === 1) return { ...b, next: [], index, duelsDone, winner: next[0] };
  // Nova rodada; vencedoras que passaram direto entram por último.
  const { duel: nextDuel, carry, byes } = withBye(next, b.byes);
  return { ...b, current: nextDuel, next: carry, index: 0, round: b.round + 1, byes, duelsDone };
}

/** Nome da fase pelo número de opções ainda vivas. */
export function stageLabel(b: Battle): string {
  const alive = b.current.length - b.index + b.next.length;
  if (alive <= 2) return 'Grande final';
  if (alive <= 4) return 'Semifinal';
  if (alive <= 8) return 'Quartas de final';
  return `Rodada ${b.round}`;
}

import { cryptoSource, pickOne, type RandomSource } from '../../utils/random';

export type Vote = 'yes' | 'maybe' | 'no';

export interface OptionTally {
  id: string;
  yes: number;
  maybe: number;
  no: number;
  /** quero = 2, talvez = 1, não = 0. */
  score: number;
  vetoed?: boolean;
}

export interface GroupResult {
  /** Sem vencedor quando todo mundo disse não a tudo. */
  winnerId?: string;
  ranking: OptionTally[];
  /** Todo mundo disse quero ao vencedor. */
  unanimous: boolean;
  /** Ids empatados no topo; com mais de um, o vencedor saiu de sorteio. */
  tiedIds: string[];
}

/**
 * Junta os votos de várias pessoas. Ordem: maior pontuação, depois menos "não".
 * Empate no topo vira sorteio entre os empatados. Votos ausentes contam como "não".
 */
export function computeGroupResult(
  optionIds: string[],
  votesByPerson: Record<string, Vote>[],
  source: RandomSource = cryptoSource,
  vetoedIds: readonly string[] = [],
): GroupResult {
  const vetoed = new Set(vetoedIds);
  const ranking: OptionTally[] = optionIds.map((id) => {
    const t: OptionTally = { id, yes: 0, maybe: 0, no: 0, score: 0, vetoed: vetoed.has(id) };
    for (const person of votesByPerson) {
      const v = person[id] ?? 'no';
      t[v] += 1;
    }
    t.score = t.yes * 2 + t.maybe;
    return t;
  });
  ranking.sort((a, b) => Number(a.vetoed) - Number(b.vetoed) || b.score - a.score || a.no - b.no);

  const best = ranking.find((t) => !t.vetoed);
  if (!best || best.score === 0) return { ranking, unanimous: false, tiedIds: [] };

  const tied = ranking.filter((t) => !t.vetoed && t.score === best.score && t.no === best.no).map((t) => t.id);
  const winnerId = tied.length > 1 ? pickOne(tied, source) : best.id;
  const winner = ranking.find((t) => t.id === winnerId)!;
  // O vencedor sorteado vai para o topo da lista.
  ranking.splice(ranking.indexOf(winner), 1);
  ranking.unshift(winner);
  return {
    winnerId,
    ranking,
    unanimous: winner.yes === votesByPerson.length && votesByPerson.length > 0,
    tiedIds: tied.length > 1 ? tied : [],
  };
}

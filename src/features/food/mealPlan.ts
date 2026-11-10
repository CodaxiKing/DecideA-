import { cryptoSource, type RandomSource } from '../../utils/random';
import { shuffle } from '../../utils/shuffle';
import type { Recipe } from './types';

export const WEEK_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const;

/** Jantares: receitas marcadas para jantar (sem sobremesas). */
export function dinnerPool(all: Recipe[]): Recipe[] {
  return all.filter((r) => r.meals.includes('jantar') && !r.categories.includes('sobremesas'));
}

/**
 * Sorteia sete jantares sem repetir. Se o catálogo tiver menos de sete,
 * repete o mínimo possível (nunca dois dias seguidos iguais, quando dá).
 */
export function drawWeek(pool: Recipe[], source: RandomSource = cryptoSource): string[] {
  if (pool.length === 0) return [];
  const ids = shuffle(pool, source).map((r) => r.id);
  const out: string[] = [];
  while (out.length < 7) {
    for (const id of ids) {
      if (out.length >= 7) break;
      if (out[out.length - 1] === id && ids.length > 1) continue;
      out.push(id);
    }
  }
  return out;
}

/** Troca o jantar de um dia por outro que ainda não está na semana (se houver). */
export function redrawDay(week: string[], day: number, pool: Recipe[], source: RandomSource = cryptoSource): string[] {
  const used = new Set(week);
  const fresh = pool.filter((r) => !used.has(r.id));
  const options = fresh.length ? fresh : pool.filter((r) => r.id !== week[day]);
  if (options.length === 0) return week;
  const pick = shuffle(options, source)[0];
  return week.map((id, i) => (i === day ? pick.id : id));
}

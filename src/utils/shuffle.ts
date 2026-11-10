import { cryptoSource, randomInt, type RandomSource } from './random';

/** Fisher–Yates com a fonte aleatória injetável. Não altera a lista original. */
export function shuffle<T>(items: readonly T[], source: RandomSource = cryptoSource): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, source);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample<T>(items: readonly T[], count: number, source: RandomSource = cryptoSource): T[] {
  return shuffle(items, source).slice(0, Math.max(0, count));
}

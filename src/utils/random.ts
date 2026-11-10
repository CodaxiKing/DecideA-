import * as Crypto from 'expo-crypto';

/** Fonte de números aleatórios: devolve um inteiro em [0, 2^32). Injetável nos testes. */
export type RandomSource = () => number;

export const cryptoSource: RandomSource = () => Crypto.getRandomValues(new Uint32Array(1))[0];

const RANGE = 2 ** 32;

/**
 * Inteiro uniforme em [0, max), sem viés de módulo (amostragem por rejeição).
 */
export function randomInt(max: number, source: RandomSource = cryptoSource): number {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError('max precisa ser inteiro positivo');
  const limit = RANGE - (RANGE % max);
  for (;;) {
    const value = source();
    if (value < limit) return value % max;
  }
}

/** Número em [0, 1) a partir da mesma fonte. */
export function randomFraction(source: RandomSource = cryptoSource): number {
  return source() / RANGE;
}

export function pickOne<T>(items: readonly T[], source: RandomSource = cryptoSource): T {
  if (items.length === 0) throw new RangeError('lista vazia');
  return items[randomInt(items.length, source)];
}

export function newId(): string {
  return Crypto.randomUUID();
}

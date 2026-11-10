import { randomFraction, randomInt, type RandomSource, cryptoSource } from '../../utils/random';

/**
 * Geometria da roleta: o setor 0 começa no topo e os setores seguem no sentido horário.
 * O ponteiro fica fixo no topo. Girar a roda R graus no sentido horário faz o ponteiro
 * apontar para o ângulo (-R mod 360) da roda.
 *
 * O sorteio acontece ANTES da animação; o ângulo final é derivado do resultado.
 */

const norm = (deg: number) => ((deg % 360) + 360) % 360;

export function sectorSize(count: number): number {
  return 360 / count;
}

/** Índice do setor sob o ponteiro para uma rotação total da roda. */
export function indexAtRotation(rotation: number, count: number): number {
  const step = sectorSize(count);
  return Math.min(count - 1, Math.floor(norm(-rotation) / step));
}

export interface SpinPlan {
  index: number;
  /** Rotação absoluta final da roda, em graus, sempre maior que a atual. */
  targetRotation: number;
}

/**
 * Sorteia um setor e calcula até onde a roda deve girar para parar nele.
 * O ponto de parada cai dentro do setor, longe das bordas (margem de 15% de cada lado).
 */
export function planSpin(
  currentRotation: number,
  count: number,
  { turns = 5, source = cryptoSource }: { turns?: number; source?: RandomSource } = {},
): SpinPlan {
  if (count < 1) throw new RangeError('roleta sem opções');
  const index = randomInt(count, source);
  const step = sectorSize(count);
  const offsetInSector = step * (0.15 + 0.7 * randomFraction(source));
  const landingAngle = index * step + offsetInSector; // ângulo da roda que fica sob o ponteiro
  const desired = norm(-landingAngle); // rotação (mod 360) que coloca esse ângulo no topo
  const base = currentRotation - norm(currentRotation);
  let target = base + turns * 360 + desired;
  if (target - currentRotation < turns * 360) target += 360;
  return { index, targetRotation: target };
}

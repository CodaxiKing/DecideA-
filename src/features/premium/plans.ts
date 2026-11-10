/**
 * Limites por plano (seção 2, decisão 5, e seção 8 do plano).
 * Premium só vale com assinatura ativa confirmada pelo serviço de assinaturas;
 * nada aqui libera Premium sozinho.
 */
export interface PlanLimits {
  wheels: number;
  favorites: number;
  /** Quantas decisões o histórico mostra. */
  historyVisible: number;
  roomSize: number;
  roomMinutes: number;
  saveFilters: boolean;
}

export const FREE_LIMITS: PlanLimits = {
  wheels: 3,
  favorites: 20,
  historyVisible: 10,
  roomSize: 4,
  roomMinutes: 30,
  saveFilters: false,
};

export const PREMIUM_LIMITS: PlanLimits = {
  wheels: Number.POSITIVE_INFINITY,
  favorites: Number.POSITIVE_INFINITY,
  historyVisible: Number.POSITIVE_INFINITY,
  roomSize: 12,
  roomMinutes: 120,
  saveFilters: true,
};

export function limitsFor(isPremium: boolean): PlanLimits {
  return isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
}

export function canAdd(current: number, limit: number): boolean {
  return current < limit;
}

/** Texto do contador, por exemplo "3 de 3 roletas no plano grátis". */
export function usageLabel(current: number, limit: number, noun: string): string {
  return `${Math.min(current, limit)} de ${limit} ${noun} no plano grátis`;
}

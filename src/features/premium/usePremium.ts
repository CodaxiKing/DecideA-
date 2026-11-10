import { useEffect } from 'react';
import { create } from 'zustand';

import { useAuth } from '../../services/auth';
import { subscriptions, type SubscriptionStatus } from '../../services/subscriptions';
import { limitsFor } from './plans';

/**
 * Estado da assinatura em memória. Não é persistido de propósito: a cada abertura
 * o app pergunta de novo ao serviço de assinaturas (seção 8: nunca liberar Premium
 * por uma variável local).
 */
interface PremiumState {
  status: SubscriptionStatus;
  loaded: boolean;
  set: (status: SubscriptionStatus) => void;
}

export const usePremiumStore = create<PremiumState>()((set) => ({
  status: { isPremium: false },
  loaded: false,
  set: (status) => set({ status, loaded: true }),
}));

export function usePremium() {
  const status = usePremiumStore((s) => s.status);
  return { isPremium: status.isPremium, status, limits: limitsFor(status.isPremium) };
}

/** Liga a assinatura à conta e acompanha mudanças (renovação, expiração, cancelamento). */
export function PremiumManager() {
  const { user, registered } = useAuth();
  const userId = registered ? user!.id : null;

  useEffect(() => {
    let alive = true;
    const set = usePremiumStore.getState().set;
    subscriptions
      .identify(userId)
      .then(() => subscriptions.getStatus())
      .then((s) => alive && set(s))
      // Falha ao consultar: fica no plano grátis, que funciona sempre.
      .catch(() => alive && set({ isPremium: false }));
    const stop = subscriptions.onChange((s) => set(s));
    return () => {
      alive = false;
      stop();
    };
  }, [userId]);

  return null;
}

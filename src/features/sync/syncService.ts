import { syncRepository } from '../../repositories/syncRepository';
import { supabase } from '../../services/supabase';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { HISTORY_STORAGE_LIMIT, useHistoryStore } from '../../stores/historyStore';
import { useWheelStore } from '../../stores/wheelStore';
import { mergeFavorites, mergeHistory, mergeWheels } from './merge';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let running: Promise<void> | null = null;

/** Lê a declaração is_anonymous do token (JWT), sem validar a assinatura. */
export function tokenSaysAnonymous(accessToken: string): boolean {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(globalThis.atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '='))).is_anonymous === true;
  } catch {
    return false;
  }
}

/** Depois que um convidado vira conta, o token antigo ainda diz "anônimo" até ser renovado. */
async function refreshIfStaleAnonymousToken() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (session && !session.user.is_anonymous && tokenSaysAnonymous(session.access_token)) {
    await supabase.auth.refreshSession();
  }
}

/**
 * Sincroniza os dados locais com a conta: envia o que o aparelho tem (por id,
 * então nada duplica), aplica exclusões pendentes e traz o que veio de outros
 * aparelhos. Também serve para migrar os dados de quem usava o app sem conta.
 */
export function syncAll(userId: string): Promise<void> {
  if (running) return running;
  running = (async () => {
    if (!supabase) return;
    await refreshIfStaleAnonymousToken();
    const repo = syncRepository(supabase, userId);

    const deletedWheels = [...useWheelStore.getState().deletedIds];
    const removedFavs = [...useFavoritesStore.getState().removed];

    // 1. Exclusões pendentes primeiro, para não voltarem na próxima leitura.
    await repo.deleteWheels(deletedWheels.filter((id) => UUID.test(id)));
    await repo.deleteFavorites(removedFavs);

    // 2. Traz o que está na conta e junta com o aparelho (vence a edição mais recente).
    const [remoteWheels, remoteFavs, remoteHistory] = await Promise.all([
      repo.pullWheels(),
      repo.pullFavorites(),
      repo.pullHistory(HISTORY_STORAGE_LIMIT),
    ]);
    const wheels = mergeWheels(useWheelStore.getState().wheels, remoteWheels, useWheelStore.getState().deletedIds);
    const favorites = mergeFavorites(useFavoritesStore.getState().items, remoteFavs, useFavoritesStore.getState().removed);
    const history = mergeHistory(useHistoryStore.getState().entries, remoteHistory, HISTORY_STORAGE_LIMIT);

    // 3. Envia o resultado. Os ids vêm do aparelho, então reenviar não duplica.
    const remoteById = new Map(remoteWheels.map((w) => [w.id, w]));
    const changedWheels = wheels.filter((w) => {
      const r = remoteById.get(w.id);
      return UUID.test(w.id) && w.options.every((o) => UUID.test(o.id)) && (!r || r.updatedAt !== w.updatedAt || r.lastSpunAt !== w.lastSpunAt);
    });
    await repo.pushWheels(changedWheels);
    await repo.pushFavorites(favorites);
    const remoteHistoryIds = new Set(remoteHistory.map((e) => e.id));
    await repo.pushHistory(history.filter((e) => UUID.test(e.id) && !remoteHistoryIds.has(e.id)));

    // 4. Atualiza o aparelho.
    useWheelStore.getState().replaceAll(wheels);
    useWheelStore.getState().clearDeleted(deletedWheels);
    useFavoritesStore.getState().replaceAll(favorites);
    useFavoritesStore.getState().clearRemoved(removedFavs);
    useHistoryStore.getState().replaceAll(history);
  })().finally(() => {
    running = null;
  });
  return running;
}

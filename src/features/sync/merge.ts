import type { DecisionEntry } from '../../stores/historyStore';
import type { Favorite } from '../../stores/favoritesStore';
import type { Wheel } from '../wheel/types';

/**
 * Junta roletas locais e da conta pelo id. Mesmo id = mesma roleta: fica a versão
 * editada por último. Roletas apagadas em qualquer lado (tombstones) saem.
 */
export function mergeWheels(local: Wheel[], remote: Wheel[], deletedIds: string[] = []): Wheel[] {
  const deleted = new Set(deletedIds);
  const byId = new Map<string, Wheel>();
  for (const w of [...remote, ...local]) {
    if (deleted.has(w.id)) continue;
    const prev = byId.get(w.id);
    if (!prev || w.updatedAt > prev.updatedAt) {
      // Guarda o giro mais recente, venha de onde vier.
      const lastSpunAt = [prev?.lastSpunAt, w.lastSpunAt].filter(Boolean).sort().pop();
      byId.set(w.id, { ...w, lastSpunAt });
    } else if (w.lastSpunAt && (!prev.lastSpunAt || w.lastSpunAt > prev.lastSpunAt)) {
      byId.set(w.id, { ...prev, lastSpunAt: w.lastSpunAt });
    }
  }
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

const favKey = (f: Pick<Favorite, 'kind' | 'id'>) => `${f.kind}:${f.id}`;

/** União de favoritos sem repetir; removidos (tombstones) saem; fica a data mais antiga. */
export function mergeFavorites(local: Favorite[], remote: Favorite[], removed: Pick<Favorite, 'kind' | 'id'>[] = []): Favorite[] {
  const gone = new Set(removed.map(favKey));
  const byKey = new Map<string, Favorite>();
  for (const f of [...remote, ...local]) {
    const k = favKey(f);
    if (gone.has(k)) continue;
    const prev = byKey.get(k);
    if (!prev || f.addedAt < prev.addedAt) byKey.set(k, f);
  }
  return [...byKey.values()].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/** União do histórico pelo id, mais recente primeiro, com teto de tamanho. */
export function mergeHistory(local: DecisionEntry[], remote: DecisionEntry[], limit: number): DecisionEntry[] {
  const byId = new Map<string, DecisionEntry>();
  for (const e of [...remote, ...local]) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type FavoriteKind = 'food' | 'movie';

export interface Favorite {
  kind: FavoriteKind;
  id: string;
  addedAt: string;
}

interface FavoritesState {
  items: Favorite[];
  /** Favoritos removidos ainda não enviados para a conta. */
  removed: { kind: FavoriteKind; id: string }[];
  replaceAll: (items: Favorite[]) => void;
  clearRemoved: (keys: { kind: FavoriteKind; id: string }[]) => void;
  isFavorite: (kind: FavoriteKind, id: string) => boolean;
  /** Liga ou desliga. Devolve o novo estado. */
  toggle: (kind: FavoriteKind, id: string) => boolean;
  remove: (kind: FavoriteKind, id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      removed: [],
      replaceAll: (items) => set({ items }),
      clearRemoved: (keys) =>
        set((s) => ({ removed: s.removed.filter((r) => !keys.some((k) => k.kind === r.kind && k.id === r.id)) })),
      isFavorite: (kind, id) => get().items.some((f) => f.kind === kind && f.id === id),
      toggle: (kind, id) => {
        const exists = get().isFavorite(kind, id);
        set((s) => ({
          items: exists
            ? s.items.filter((f) => !(f.kind === kind && f.id === id))
            : [{ kind, id, addedAt: new Date().toISOString() }, ...s.items],
          removed: exists
            ? [...s.removed, { kind, id }]
            : s.removed.filter((r) => !(r.kind === kind && r.id === id)),
        }));
        return !exists;
      },
      remove: (kind, id) =>
        set((s) => ({ items: s.items.filter((f) => !(f.kind === kind && f.id === id)), removed: [...s.removed, { kind, id }] })),
    }),
    { name: 'decideai.favorites', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

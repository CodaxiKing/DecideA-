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
  isFavorite: (kind: FavoriteKind, id: string) => boolean;
  /** Liga ou desliga. Devolve o novo estado. */
  toggle: (kind: FavoriteKind, id: string) => boolean;
  remove: (kind: FavoriteKind, id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      isFavorite: (kind, id) => get().items.some((f) => f.kind === kind && f.id === id),
      toggle: (kind, id) => {
        const exists = get().isFavorite(kind, id);
        set((s) => ({
          items: exists
            ? s.items.filter((f) => !(f.kind === kind && f.id === id))
            : [{ kind, id, addedAt: new Date().toISOString() }, ...s.items],
        }));
        return !exists;
      },
      remove: (kind, id) => set((s) => ({ items: s.items.filter((f) => !(f.kind === kind && f.id === id)) })),
    }),
    { name: 'decideai.favorites', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

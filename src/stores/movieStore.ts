import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { emptyMovieFilters, type MovieFilters } from '../features/movies/catalog';
import type { MovieVote } from '../features/movies/types';
import { usePreferenceSignals } from './preferenceSignalsStore';

interface MovieState {
  /** Voto da pessoa em cada título, para "Meus votos". */
  votes: Record<string, { vote: MovieVote; at: string }>;
  filters: MovieFilters;
  vote: (id: string, vote: MovieVote) => void;
  clearVote: (id: string) => void;
  resetVotes: () => void;
  setFilters: (filters: MovieFilters) => void;
}

export const useMovieStore = create<MovieState>()(
  persist(
    (set) => ({
      votes: {},
      filters: emptyMovieFilters,
      vote: (id, vote) => {
        if (vote !== 'maybe') usePreferenceSignals.getState().record('movie', id, vote === 'yes' ? 'accept' : 'reject');
        set((s) => ({ votes: { ...s.votes, [id]: { vote, at: new Date().toISOString() } } }));
      },
      clearVote: (id) =>
        set((s) => {
          const next = { ...s.votes };
          delete next[id];
          return { votes: next };
        }),
      resetVotes: () => set({ votes: {} }),
      setFilters: (filters) => set({ filters }),
    }),
    {
      name: 'decideai.movies',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Filtros salvos entre sessões são Premium (Fase 7); só os votos persistem.
      partialize: (s) => ({ votes: s.votes }),
    },
  ),
);

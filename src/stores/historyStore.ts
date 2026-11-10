import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { newId } from '../utils/random';

export type DecisionKind = 'wheel' | 'food' | 'movie';

export interface DecisionEntry {
  id: string;
  kind: DecisionKind;
  /** O que foi decidido, por exemplo "Sushi". */
  title: string;
  /** De onde veio, por exemplo "Roleta O que comer?". */
  source: string;
  createdAt: string;
  /** Referência opcional ao item (id da receita, do filme ou da roleta). */
  refId?: string;
}

/** Quantas decisões o aparelho guarda. O que o plano grátis mostra é decidido na tela. */
export const HISTORY_STORAGE_LIMIT = 200;

interface HistoryState {
  entries: DecisionEntry[];
  addEntry: (entry: Omit<DecisionEntry, 'id' | 'createdAt'> & { createdAt?: string }) => DecisionEntry;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (input) => {
        const entry: DecisionEntry = { id: newId(), createdAt: new Date().toISOString(), ...input };
        set((s) => ({ entries: [entry, ...s.entries].slice(0, HISTORY_STORAGE_LIMIT) }));
        return entry;
      },
      clear: () => set({ entries: [] }),
    }),
    { name: 'decideai.history', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { choose, startBattle, type Battle } from '../features/battle/engine';

export type BattleKind = 'food' | 'movie' | 'activity' | 'wheel';

export interface BattleOption {
  id: string;
  label: string;
}

interface BattleState {
  kind?: BattleKind;
  /** Para roletas, o rótulo de cada opção (não há catálogo). */
  options: BattleOption[];
  source?: string;
  battle?: Battle;
  start: (kind: BattleKind, options: BattleOption[], source: string) => void;
  pick: (id: string) => void;
  clear: () => void;
}

export const useBattleStore = create<BattleState>()(
  persist(
    (set, get) => ({
      options: [],
      start: (kind, options, source) => set({ kind, options, source, battle: startBattle(options.map((o) => o.id)) }),
      pick: (id) => {
        const b = get().battle;
        if (b) set({ battle: choose(b, id) });
      },
      clear: () => set({ kind: undefined, options: [], source: undefined, battle: undefined }),
    }),
    { name: 'decideai.battle', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Cardápio da semana e itens marcados na lista de compras. */
interface KitchenState {
  week: string[];
  weekCreatedAt?: string;
  checked: Record<string, boolean>;
  setWeek: (week: string[]) => void;
  toggleChecked: (key: string) => void;
  clearChecked: () => void;
}

export const useKitchenStore = create<KitchenState>()(
  persist(
    (set) => ({
      week: [],
      checked: {},
      setWeek: (week) => set({ week, weekCreatedAt: new Date().toISOString() }),
      toggleChecked: (key) => set((s) => ({ checked: { ...s.checked, [key]: !s.checked[key] } })),
      clearChecked: () => set({ checked: {} }),
    }),
    { name: 'decideai.kitchen', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

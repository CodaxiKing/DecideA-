import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Wheel } from '../features/wheel/types';
import type { WheelDraft } from '../features/wheel/validation';
import { cleanDraft } from '../features/wheel/validation';
import { newId } from '../utils/random';

interface WheelState {
  wheels: Wheel[];
  createWheel: (draft: WheelDraft) => Wheel;
  updateWheel: (id: string, draft: WheelDraft) => void;
  duplicateWheel: (id: string) => Wheel | undefined;
  deleteWheel: (id: string) => void;
  markSpun: (id: string, at?: string) => void;
}

const now = () => new Date().toISOString();

export const useWheelStore = create<WheelState>()(
  persist(
    (set, get) => ({
      wheels: [],
      createWheel: (draft) => {
        const clean = cleanDraft(draft);
        const at = now();
        const wheel: Wheel = { id: newId(), name: clean.name, options: clean.options, createdAt: at, updatedAt: at };
        set((s) => ({ wheels: [wheel, ...s.wheels] }));
        return wheel;
      },
      updateWheel: (id, draft) => {
        const clean = cleanDraft(draft);
        set((s) => ({
          wheels: s.wheels.map((w) => (w.id === id ? { ...w, ...clean, updatedAt: now() } : w)),
        }));
      },
      duplicateWheel: (id) => {
        const source = get().wheels.find((w) => w.id === id);
        if (!source) return undefined;
        const at = now();
        const copy: Wheel = {
          id: newId(),
          name: `${source.name} (cópia)`.slice(0, 40),
          options: source.options.map((o) => ({ id: newId(), label: o.label })),
          createdAt: at,
          updatedAt: at,
        };
        set((s) => ({ wheels: [copy, ...s.wheels] }));
        return copy;
      },
      deleteWheel: (id) => set((s) => ({ wheels: s.wheels.filter((w) => w.id !== id) })),
      markSpun: (id, at = now()) =>
        set((s) => ({ wheels: s.wheels.map((w) => (w.id === id ? { ...w, lastSpunAt: at } : w)) })),
    }),
    { name: 'decideai.wheels', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

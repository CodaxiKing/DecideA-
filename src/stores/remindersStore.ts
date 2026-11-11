import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultReminders, type ReminderSettings } from '../features/retention/reminders';

interface RemindersState {
  settings: ReminderSettings;
  /** Conquistas já comemoradas (para não avisar de novo). */
  celebrated: string[];
  update: (patch: Partial<ReminderSettings>) => void;
  markCelebrated: (ids: string[]) => void;
}

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set) => ({
      settings: defaultReminders,
      celebrated: [],
      update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      markCelebrated: (ids) => set((s) => ({ celebrated: [...new Set([...s.celebrated, ...ids])] })),
    }),
    { name: 'decideai.reminders', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WheelThemeId } from '../features/packs/packs';

export type ThemePreference = 'system' | 'light' | 'dark';

interface PreferencesState {
  themePreference: ThemePreference;
  hapticsEnabled: boolean;
  /** Som ao girar a roleta. */
  soundEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
  /** Tema da roleta (Premium). */
  wheelTheme: WheelThemeId;
  setWheelTheme: (value: WheelThemeId) => void;
  setThemePreference: (value: ThemePreference) => void;
  setHapticsEnabled: (value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      hapticsEnabled: true,
      soundEnabled: true,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      wheelTheme: 'classica',
      setWheelTheme: (wheelTheme) => set({ wheelTheme }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
    }),
    {
      name: 'decideai.preferences',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

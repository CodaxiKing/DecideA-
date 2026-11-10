import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

interface PreferencesState {
  themePreference: ThemePreference;
  hapticsEnabled: boolean;
  setThemePreference: (value: ThemePreference) => void;
  setHapticsEnabled: (value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      hapticsEnabled: true,
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

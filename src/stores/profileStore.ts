import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Dados locais da pessoa, usados também sem conta (nome nas salas). */
interface ProfileState {
  displayName: string;
  setDisplayName: (name: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      displayName: '',
      setDisplayName: (displayName) => set({ displayName: displayName.slice(0, 20) }),
    }),
    { name: 'decideai.profile', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

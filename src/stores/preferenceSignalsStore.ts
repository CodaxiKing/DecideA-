import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { signalKey, type PreferenceSignal, type SignalKind } from '../features/preferences/engine';

export type RepeatWindow = 3 | 7 | 30;

/**
 * Memória de preferências (Fase 9). É dado de comportamento: a pessoa pode
 * desligar e apagar a qualquer momento (seção 12 do plano).
 */
interface PreferenceSignalsState {
  learn: boolean;
  avoidRepeats: boolean;
  repeatDays: RepeatWindow;
  signals: Record<string, PreferenceSignal>;
  setLearn: (v: boolean) => void;
  setAvoidRepeats: (v: boolean) => void;
  setRepeatDays: (v: RepeatWindow) => void;
  record: (kind: SignalKind, id: string, outcome: 'accept' | 'reject', amount?: number) => void;
  replaceSignals: (signals: Record<string, PreferenceSignal>) => void;
  clear: () => void;
}

export const usePreferenceSignals = create<PreferenceSignalsState>()(
  persist(
    (set, get) => ({
      learn: true,
      avoidRepeats: true,
      repeatDays: 7,
      signals: {},
      setLearn: (learn) => set({ learn }),
      setAvoidRepeats: (avoidRepeats) => set({ avoidRepeats }),
      setRepeatDays: (repeatDays) => set({ repeatDays }),
      record: (kind, id, outcome, amount = 1) => {
        if (!get().learn) return;
        const key = signalKey(kind, id);
        const prev = get().signals[key] ?? { kind, id, accepted: 0, rejected: 0, updatedAt: '' };
        const next: PreferenceSignal = {
          ...prev,
          accepted: prev.accepted + (outcome === 'accept' ? amount : 0),
          rejected: prev.rejected + (outcome === 'reject' ? amount : 0),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ signals: { ...s.signals, [key]: next } }));
      },
      replaceSignals: (signals) => set({ signals }),
      clear: () => set({ signals: {} }),
    }),
    { name: 'decideai.preference-signals', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

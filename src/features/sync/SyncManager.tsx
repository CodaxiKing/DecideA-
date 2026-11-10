import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';

import { useAuth } from '../../services/auth';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useHistoryStore } from '../../stores/historyStore';
import { usePreferenceSignals } from '../../stores/preferenceSignalsStore';
import { useWheelStore } from '../../stores/wheelStore';
import { syncAll } from './syncService';

interface SyncStatus {
  state: 'idle' | 'syncing' | 'error';
  lastSyncedAt?: string;
  error?: string;
  set: (s: Partial<Omit<SyncStatus, 'set'>>) => void;
}

export const useSyncStatus = create<SyncStatus>()((set) => ({ state: 'idle', set: (s) => set(s) }));

export async function runSync(userId: string) {
  const status = useSyncStatus.getState();
  status.set({ state: 'syncing', error: undefined });
  try {
    await syncAll(userId);
    status.set({ state: 'idle', lastSyncedAt: new Date().toISOString() });
  } catch (e) {
    status.set({ state: 'error', error: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * Sincroniza quem tem conta: ao entrar, ao voltar para o app e alguns segundos
 * depois de cada mudança local. Sem conta, não faz nada (tudo fica no aparelho).
 */
export function SyncManager() {
  const { user, registered } = useAuth();
  const userId = registered ? user!.id : undefined;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    runSync(userId);

    const schedule = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => runSync(userId), 4000);
    };
    const unsubs = [
      useWheelStore.subscribe((s, p) => s.wheels !== p.wheels && schedule()),
      useFavoritesStore.subscribe((s, p) => s.items !== p.items && schedule()),
      useHistoryStore.subscribe((s, p) => s.entries !== p.entries && schedule()),
      usePreferenceSignals.subscribe((s, p) => s.signals !== p.signals && schedule()),
    ];
    const app = AppState.addEventListener('change', (state) => state === 'active' && schedule());
    return () => {
      clearTimeout(timer.current);
      unsubs.forEach((u) => u());
      app.remove();
    };
  }, [userId]);

  return null;
}

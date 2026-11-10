import { create } from 'zustand';

import type { ActivityFilters } from '../features/activities/catalog';

/** Filtros da sessão do O Que Fazer? (não persistidos). */
interface ActivityState {
  filters: ActivityFilters;
  lastDrawnId?: string;
  setFilters: (filters: ActivityFilters) => void;
  setLastDrawn: (id: string) => void;
}

export const useActivityStore = create<ActivityState>()((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  setLastDrawn: (lastDrawnId) => set({ lastDrawnId }),
}));

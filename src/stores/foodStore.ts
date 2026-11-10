import { create } from 'zustand';

import { emptyFilters, type DrawChoice, type FoodFilters } from '../features/food/engine';

/**
 * Estado da sessão do O Que Comer? (não persistido).
 * Guardar filtros para a próxima vez é recurso Premium (Fase 7).
 */
interface FoodSessionState {
  choices: DrawChoice[];
  filters: FoodFilters;
  ingredients: string[];
  lastDrawnId?: string;
  toggleChoice: (choice: DrawChoice) => void;
  setFilters: (filters: FoodFilters) => void;
  addIngredient: (name: string) => void;
  removeIngredient: (name: string) => void;
  setLastDrawn: (id: string) => void;
}

export const useFoodStore = create<FoodSessionState>()((set) => ({
  choices: ['caseira', 'lanches', 'massas'],
  filters: emptyFilters,
  ingredients: [],
  toggleChoice: (choice) =>
    set((s) => {
      if (choice === 'surpresa') return { choices: s.choices.includes('surpresa') ? [] : ['surpresa'] };
      const without = s.choices.filter((c) => c !== 'surpresa');
      return {
        choices: without.includes(choice) ? without.filter((c) => c !== choice) : [...without, choice],
      };
    }),
  setFilters: (filters) => set({ filters }),
  addIngredient: (name) =>
    set((s) => {
      const clean = name.trim();
      if (!clean || s.ingredients.some((i) => i.toLowerCase() === clean.toLowerCase())) return s;
      return { ingredients: [...s.ingredients, clean] };
    }),
  removeIngredient: (name) => set((s) => ({ ingredients: s.ingredients.filter((i) => i !== name) })),
  setLastDrawn: (id) => set({ lastDrawnId: id }),
}));

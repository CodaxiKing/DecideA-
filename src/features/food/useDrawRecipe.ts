import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { useFoodStore } from '../../stores/foodStore';
import { useHistoryStore } from '../../stores/historyStore';
import { usePreferenceSignals } from '../../stores/preferenceSignalsStore';
import { smartPick } from '../preferences/smartPick';
import { recipesForChoices } from './engine';
import { recipes } from './recipes';

/** Sorteia uma receita pelas escolhas e filtros atuais, registra no histórico e abre o resultado. */
export function useDrawRecipe() {
  const router = useRouter();
  return (mode: 'push' | 'replace' = 'push') => {
    const { choices, filters, lastDrawnId, setLastDrawn } = useFoodStore.getState();
    const pool = recipesForChoices(recipes, choices, filters);
    // "Sortear outra" conta como recusa leve do prato anterior.
    if (mode === 'replace' && lastDrawnId) usePreferenceSignals.getState().record('food', lastDrawnId, 'reject');
    const recipe = smartPick('food', pool, (r) => r.id, lastDrawnId);
    if (!recipe) {
      Alert.alert('Nenhuma receita', 'Nenhum prato combina com essas categorias e filtros. Tente afrouxar os filtros.');
      return;
    }
    setLastDrawn(recipe.id);
    useHistoryStore.getState().addEntry({ kind: 'food', title: recipe.name, source: 'Sorteio rápido', refId: recipe.id });
    const target = { pathname: '/comer/resultado' as const, params: { id: recipe.id, total: String(pool.length) } };
    if (mode === 'replace') router.replace(target);
    else router.push(target);
  };
}

import type { DeckItem } from '../../components/swipe/SwipeDeck';
import { useFoodStore } from '../../stores/foodStore';
import { useMovieStore } from '../../stores/movieStore';
import { findRecipe } from '../food/recipes';
import { recipeToDeckItem, movieToDeckItem } from '../movies/deckItems';
import { findDemoTitle, movieCatalog } from '../movies/catalog';
import { pickFoodOptions, pickMovieOptions } from '../pass/options';
import type { RoomItemType, RoomOption } from './types';

/** Monta as opções da sala com as escolhas e filtros atuais de cada ferramenta. */
export function buildRoomOptions(itemType: RoomItemType): { ref_id: string; title: string }[] {
  if (itemType === 'food') {
    const { choices, filters } = useFoodStore.getState();
    return pickFoodOptions(choices, filters).map((id) => ({ ref_id: id, title: findRecipe(id)?.name ?? id }));
  }
  const yes = Object.entries(useMovieStore.getState().votes)
    .filter(([, v]) => v.vote === 'yes')
    .map(([id]) => id);
  return pickMovieOptions(useMovieStore.getState().filters, yes).map((id) => ({ ref_id: id, title: findDemoTitle(id)?.title ?? id }));
}

/** Cartão de votação da opção; usa o título salvo na sala se o item não existir neste aparelho. */
export function roomOptionToDeckItem(itemType: RoomItemType, option: RoomOption): DeckItem {
  if (itemType === 'food') {
    const r = findRecipe(option.ref_id);
    if (r) return { ...recipeToDeckItem(r, option.position), id: option.id };
  }
  if (itemType === 'movie') {
    const t = findDemoTitle(option.ref_id);
    if (t) return { ...movieToDeckItem(t, movieCatalog.isDemo), id: option.id };
  }
  return { id: option.id, title: option.title, color: '#5A2BE0', tags: [] };
}

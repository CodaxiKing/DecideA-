import type { DeckItem } from '../../components/swipe/SwipeDeck';
import { recipeSummary } from '../../components/food/RecipeTags';
import type { PassKind } from '../../stores/passStore';
import { emptyFilters, recipesForChoices, type DrawChoice, type FoodFilters } from '../food/engine';
import { findRecipe, recipes } from '../food/recipes';
import { activities, activityById, matchesActivity, type ActivityFilters } from '../activities/catalog';
import { activityToDeckItem, recipeToDeckItem, movieToDeckItem } from '../movies/deckItems';
import { demoTitles } from '../movies/demoCatalog';
import { findDemoTitle, matchesMovieFilters, movieCatalog, type MovieFilters } from '../movies/catalog';
import { sample } from '../../utils/shuffle';

export const PASS_OPTION_COUNT = 8;

export function pickFoodOptions(choices: DrawChoice[], filters: FoodFilters = emptyFilters): string[] {
  let pool = recipesForChoices(recipes, choices, filters);
  if (pool.length < 3) pool = recipes; // catálogo pequeno: relaxa a regra em vez de não sugerir nada
  return sample(pool, PASS_OPTION_COUNT).map((r) => r.id);
}

export function pickMovieOptions(filters: MovieFilters, preferIds: string[] = []): string[] {
  const preferred = preferIds.filter((id) => findDemoTitle(id));
  if (preferred.length >= 2) return sample(preferred, PASS_OPTION_COUNT);
  let pool = demoTitles.filter((t) => matchesMovieFilters(t, filters));
  if (pool.length < 3) pool = demoTitles;
  return sample(pool, PASS_OPTION_COUNT).map((t) => t.id);
}

export function pickActivityOptions(filters: ActivityFilters): string[] {
  let pool = activities.filter((a) => matchesActivity(a, filters));
  if (pool.length < 3) pool = activities;
  return sample(pool, PASS_OPTION_COUNT).map((a) => a.id);
}

export function optionToDeckItem(kind: PassKind, id: string, index: number): DeckItem | undefined {
  if (kind === 'activity') {
    const a = activityById(id);
    return a ? activityToDeckItem(a, index) : undefined;
  }
  if (kind === 'food') {
    const r = findRecipe(id);
    return r ? recipeToDeckItem(r, index) : undefined;
  }
  const t = findDemoTitle(id);
  return t ? movieToDeckItem(t, movieCatalog.isDemo) : undefined;
}

export function optionTitle(kind: PassKind, id: string): string {
  if (kind === 'activity') return activityById(id)?.name ?? id;
  return kind === 'food' ? (findRecipe(id)?.name ?? id) : (findDemoTitle(id)?.title ?? id);
}

export function optionSubtitle(kind: PassKind, id: string): string {
  if (kind === 'food') {
    const r = findRecipe(id);
    return r ? recipeSummary(r) : '';
  }
  return '';
}

import { cryptoSource, pickOne, type RandomSource } from '../../utils/random';
import type { DietTag, FoodCategory, MealType, Recipe } from './types';

export interface FoodFilters {
  maxMinutes?: number;
  meals: MealType[];
  diets: DietTag[];
  /** Ingredientes a evitar, já normalizados. */
  avoid: string[];
}

export const emptyFilters: FoodFilters = { meals: [], diets: [], avoid: [] };

export function activeFilterCount(f: FoodFilters): number {
  return (f.maxMinutes ? 1 : 0) + f.meals.length + f.diets.length + f.avoid.length;
}

/** Minúsculas, sem acento, sem espaços extras e sem plural simples ("tomates" → "tomate"). */
export function normalizeIngredient(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base
    .split(' ')
    .map((w) => (w.length > 3 && w.endsWith('oes') ? `${w.slice(0, -3)}ao` : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
    .join(' ');
}

/** Sinônimos comuns para o que a pessoa digita. */
const synonyms: Record<string, string> = {
  massa: 'macarrao',
  espaguete: 'macarrao',
  penne: 'macarrao',
  'carne moida': 'carne',
  'peito de frango': 'frango',
  ovos: 'ovo',
  'queijo mucarela': 'queijo',
  mucarela: 'queijo',
  mussarela: 'queijo',
  'queijo ralado': 'queijo',
  parmesao: 'parmesao',
  'molho de tomate': 'tomate',
  aipim: 'mandioca',
  macaxeira: 'mandioca',
  'pao de forma': 'pao',
  'grao de bico': 'grao de bico',
  cogumelos: 'cogumelo',
  champignon: 'cogumelo',
};

export function ingredientKey(text: string): string {
  const n = normalizeIngredient(text);
  return synonyms[n] ?? n;
}

function hasAvoided(recipe: Recipe, avoid: string[]): boolean {
  if (avoid.length === 0) return false;
  return recipe.ingredients.some((ing) => {
    const nameKey = normalizeIngredient(ing.name);
    const key = ingredientKey(ing.key);
    return avoid.some((a) => key === a || nameKey.includes(a));
  });
}

export function matchesFilters(recipe: Recipe, f: FoodFilters): boolean {
  if (f.maxMinutes && recipe.minutes > f.maxMinutes) return false;
  if (f.meals.length && !f.meals.some((m) => recipe.meals.includes(m))) return false;
  if (f.diets.length && !f.diets.every((d) => recipe.diets.includes(d))) return false;
  return !hasAvoided(recipe, f.avoid);
}

/** Categorias do sorteio rápido. "Vegetarianas" e "Surpreenda-me" são escolhas especiais. */
export type DrawChoice = FoodCategory | 'vegetarianas' | 'surpresa';

export function recipesForChoices(all: Recipe[], choices: DrawChoice[], filters: FoodFilters): Recipe[] {
  const surprise = choices.length === 0 || choices.includes('surpresa');
  const cats = choices.filter((c): c is FoodCategory => c !== 'vegetarianas' && c !== 'surpresa');
  const veg = choices.includes('vegetarianas');
  return all.filter((r) => {
    if (!matchesFilters(r, filters)) return false;
    if (surprise) return true;
    return r.categories.some((c) => cats.includes(c)) || (veg && r.diets.includes('vegetariano'));
  });
}

/**
 * Sorteia uma receita. Evita repetir a anterior quando houver outra opção;
 * se só sobrar ela, repete em vez de não sugerir nada.
 */
export function drawRecipe(pool: Recipe[], previousId?: string, source: RandomSource = cryptoSource): Recipe | undefined {
  if (pool.length === 0) return undefined;
  const fresh = pool.length > 1 ? pool.filter((r) => r.id !== previousId) : pool;
  return pickOne(fresh, source);
}

export interface IngredientMatch {
  recipe: Recipe;
  have: string[];
  missing: string[];
  /** Ingredientes que contam (sem os de despensa). */
  total: number;
}

/**
 * Cruza o que a pessoa tem com o catálogo. Mostra receitas com pelo menos um ingrediente,
 * ordenadas por menos faltas e depois por maior proporção.
 */
export function matchByIngredients(all: Recipe[], haveRaw: string[], filters: FoodFilters = emptyFilters): IngredientMatch[] {
  const have = new Set(haveRaw.map(ingredientKey).filter(Boolean));
  if (have.size === 0) return [];
  const results: IngredientMatch[] = [];
  for (const recipe of all) {
    if (!matchesFilters(recipe, filters)) continue;
    const counted = recipe.ingredients.filter((ing) => !ing.pantry);
    const owned = (key: string) => have.has(ingredientKey(key));
    const got = counted.filter((ing) => owned(ing.key));
    if (got.length === 0) continue;
    results.push({
      recipe,
      have: got.map((g) => g.name),
      missing: counted.filter((ing) => !owned(ing.key)).map((m) => m.name),
      total: counted.length,
    });
  }
  return results.sort(
    (a, b) => a.missing.length - b.missing.length || b.have.length / b.total - a.have.length / a.total,
  );
}

/** "Falta queijo." / "Faltam azeite e parmesão." / "Você tem tudo!" */
export function describeMissing(missing: string[]): string {
  if (missing.length === 0) return 'Você tem tudo!';
  const names = missing.map((m) => m.split(/[ (]/)[0].toLowerCase());
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
  return `${names.length === 1 ? 'Falta' : 'Faltam'} ${list}.`;
}

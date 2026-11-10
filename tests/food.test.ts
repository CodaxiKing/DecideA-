import {
  describeMissing,
  drawRecipe,
  emptyFilters,
  ingredientKey,
  matchByIngredients,
  matchesFilters,
  normalizeIngredient,
  recipesForChoices,
} from '../src/features/food/engine';
import { recipes } from '../src/features/food/recipes';
import { useFavoritesStore } from '../src/stores/favoritesStore';
import { useFoodStore } from '../src/stores/foodStore';

const byId = (id: string) => recipes.find((r) => r.id === id)!;

describe('catálogo', () => {
  it('tem receitas completas e ids únicos', () => {
    const ids = new Set(recipes.map((r) => r.id));
    expect(ids.size).toBe(recipes.length);
    for (const r of recipes) {
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
      expect(r.minutes).toBeGreaterThan(0);
      expect(r.categories.length).toBeGreaterThan(0);
      if (r.diets.includes('vegano')) expect(r.diets).toContain('vegetariano');
    }
  });

  it('cobre todas as categorias do sorteio rápido', () => {
    for (const c of ['caseira', 'fastfood', 'lanches', 'massas', 'japonesa', 'sobremesas'] as const) {
      expect(recipes.some((r) => r.categories.includes(c))).toBe(true);
    }
  });
});

describe('normalização de ingredientes', () => {
  it('ignora acento, caixa e plural simples', () => {
    expect(normalizeIngredient('  Brócolis ')).toBe('brocoli');
    expect(normalizeIngredient('Tomates')).toBe('tomate');
    expect(normalizeIngredient('Limões')).toBe('limao');
  });

  it('entende sinônimos comuns', () => {
    expect(ingredientKey('Espaguete')).toBe('macarrao');
    expect(ingredientKey('Mussarela')).toBe('queijo');
    expect(ingredientKey('aipim')).toBe('mandioca');
  });
});

describe('filtros', () => {
  it('tempo, refeição e dieta', () => {
    const omelete = byId('omelete-brocolis');
    expect(matchesFilters(omelete, { ...emptyFilters, maxMinutes: 15 })).toBe(true);
    expect(matchesFilters(byId('lasanha-bolonhesa'), { ...emptyFilters, maxMinutes: 30 })).toBe(false);
    expect(matchesFilters(omelete, { ...emptyFilters, meals: ['cafe'] })).toBe(true);
    expect(matchesFilters(omelete, { ...emptyFilters, diets: ['vegano'] })).toBe(false);
  });

  it('ingredientes a evitar', () => {
    expect(matchesFilters(byId('espaguete-carbonara'), { ...emptyFilters, avoid: ['bacon'] })).toBe(false);
    expect(matchesFilters(byId('omelete-brocolis'), { ...emptyFilters, avoid: ['bacon'] })).toBe(true);
  });

  it('escolha vegetarianas traz só pratos vegetarianos', () => {
    const pool = recipesForChoices(recipes, ['vegetarianas'], emptyFilters);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((r) => r.diets.includes('vegetariano'))).toBe(true);
  });

  it('surpreenda-me e nenhuma escolha usam o catálogo todo', () => {
    expect(recipesForChoices(recipes, ['surpresa'], emptyFilters)).toHaveLength(recipes.length);
    expect(recipesForChoices(recipes, [], emptyFilters)).toHaveLength(recipes.length);
  });
});

describe('sorteio', () => {
  it('não repete a anterior quando há outra opção', () => {
    const pool = [byId('omelete-brocolis'), byId('misto-quente')];
    for (let k = 0; k < 50; k++) expect(drawRecipe(pool, 'omelete-brocolis')?.id).toBe('misto-quente');
  });

  it('repete se for a única opção e não quebra com lista vazia', () => {
    expect(drawRecipe([byId('misto-quente')], 'misto-quente')?.id).toBe('misto-quente');
    expect(drawRecipe([])).toBeUndefined();
  });
});

describe('tenho estes ingredientes', () => {
  it('ordena por menos faltas e descreve o que falta', () => {
    const results = matchByIngredients(recipes, ['macarrão', 'alho', 'brócolis', 'ovos']);
    expect(results.length).toBeGreaterThan(0);
    for (let k = 1; k < results.length; k++) {
      expect(results[k].missing.length).toBeGreaterThanOrEqual(results[k - 1].missing.length);
    }
    const alhoOleo = results.find((r) => r.recipe.id === 'macarrao-alho-oleo')!;
    expect(alhoOleo.have).toHaveLength(2);
    expect(describeMissing(alhoOleo.missing)).toBe('Faltam azeite e salsinha.');
  });

  it('encontra a receita mesmo com acento e plural diferentes do catálogo', () => {
    const r = matchByIngredients(recipes, ['Brócolis', 'ovos', 'queijo']).find((m) => m.recipe.id === 'omelete-brocolis');
    expect(r?.missing).toEqual([]);
  });

  it('itens de despensa não contam como faltando', () => {
    const r = matchByIngredients(recipes, ['batata', 'azeite', 'alecrim', 'alho']).find((m) => m.recipe.id === 'batata-forno')!;
    expect(r.missing).toEqual([]);
    expect(describeMissing(r.missing)).toBe('Você tem tudo!');
  });

  it('lista vazia não sugere nada', () => {
    expect(matchByIngredients(recipes, [])).toEqual([]);
  });
});

describe('stores', () => {
  it('favoritos liga e desliga', () => {
    useFavoritesStore.setState({ items: [] });
    const { toggle, isFavorite } = useFavoritesStore.getState();
    expect(toggle('food', 'bolo-cenoura')).toBe(true);
    expect(isFavorite('food', 'bolo-cenoura')).toBe(true);
    expect(toggle('food', 'bolo-cenoura')).toBe(false);
    expect(useFavoritesStore.getState().items).toHaveLength(0);
  });

  it('surpreenda-me é exclusiva das outras escolhas', () => {
    useFoodStore.setState({ choices: ['massas'] });
    useFoodStore.getState().toggleChoice('surpresa');
    expect(useFoodStore.getState().choices).toEqual(['surpresa']);
    useFoodStore.getState().toggleChoice('lanches');
    expect(useFoodStore.getState().choices).toEqual(['lanches']);
  });

  it('não adiciona ingrediente repetido', () => {
    useFoodStore.setState({ ingredients: [] });
    useFoodStore.getState().addIngredient('Alho');
    useFoodStore.getState().addIngredient(' alho ');
    expect(useFoodStore.getState().ingredients).toEqual(['Alho']);
  });
});

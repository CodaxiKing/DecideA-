import { ingredientKey } from './engine';
import type { Recipe } from './types';

export interface ShoppingItem {
  key: string;
  name: string;
  /** Quantidade somada quando as unidades batem; senão, as partes juntadas por " + ". */
  quantity: string;
  /** De quais receitas veio. */
  recipes: string[];
  have: boolean;
}

interface Parsed {
  amount: number;
  unit: string;
}

const FRACTIONS: Record<string, number> = { '1/2': 0.5, '1/3': 1 / 3, '1/4': 0.25, '2/3': 2 / 3, '3/4': 0.75 };

/** "400 g" → {400, "g"}; "2 1/2 xícaras" → {2.5, "xícaras"}; "a gosto" → null. */
export function parseQuantity(q: string): Parsed | null {
  const m = q.trim().match(/^(\d+(?:[.,]\d+)?)?(?:\s*(\d\/\d))?\s+(.+)$/) ?? q.trim().match(/^(\d\/\d)\s+(.+)$/);
  if (!m) return null;
  if (m.length === 3) {
    // forma só com fração: "1/2 xícara"
    const frac = FRACTIONS[m[1]];
    return frac ? { amount: frac, unit: normalizeUnit(m[2]) } : null;
  }
  const whole = m[1] ? parseFloat(m[1].replace(',', '.')) : 0;
  const frac = m[2] ? (FRACTIONS[m[2]] ?? 0) : 0;
  if (!m[1] && !m[2]) return null;
  return { amount: whole + frac, unit: normalizeUnit(m[3]) };
}

/** Singular e plural contam como a mesma unidade ("xícara" = "xícaras"). */
function normalizeUnit(u: string): string {
  const base = u.trim().toLowerCase();
  return base
    .split(' ')
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
    .join(' ');
}

function formatAmount(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
}

function pluralize(unit: string, n: number): string {
  if (n <= 1 || unit.length <= 2) return unit; // "g", "ml", "kg"
  const [first, ...rest] = unit.split(' ');
  const plural = first.endsWith('ão') ? `${first.slice(0, -2)}ões` : /[aeiou]$/.test(first) ? `${first}s` : first;
  return [plural, ...rest].join(' ');
}

/** Soma "400 g" + "300 g" = "700 g"; unidades diferentes ficam lado a lado. */
export function sumQuantities(quantities: string[]): string {
  const byUnit = new Map<string, number>();
  const loose: string[] = [];
  for (const q of quantities) {
    const p = parseQuantity(q);
    if (!p) {
      if (!loose.includes(q)) loose.push(q);
      continue;
    }
    byUnit.set(p.unit, (byUnit.get(p.unit) ?? 0) + p.amount);
  }
  const parts = [...byUnit.entries()].map(([unit, n]) => `${formatAmount(n)} ${pluralize(unit, n)}`);
  return [...parts, ...loose].join(' + ');
}

/**
 * Lista de compras de uma ou mais receitas. Junta o mesmo ingrediente (pela
 * chave normalizada), soma quantidades e separa o que a pessoa já tem.
 */
export function buildShoppingList(recipes: Recipe[], haveRaw: string[] = []): ShoppingItem[] {
  const have = new Set(haveRaw.map(ingredientKey));
  const map = new Map<string, { name: string; quantities: string[]; recipes: string[]; pantry: boolean }>();
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      const key = ingredientKey(ing.key);
      const prev = map.get(key);
      if (prev) {
        prev.quantities.push(ing.quantity);
        if (!prev.recipes.includes(r.name)) prev.recipes.push(r.name);
        prev.pantry = prev.pantry && !!ing.pantry;
      } else {
        map.set(key, { name: ing.name, quantities: [ing.quantity], recipes: [r.name], pantry: !!ing.pantry });
      }
    }
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, name: v.name, quantity: sumQuantities(v.quantities), recipes: v.recipes, have: v.pantry || have.has(key) }))
    .sort((a, b) => Number(a.have) - Number(b.have) || a.name.localeCompare(b.name, 'pt-BR'));
}

/** Texto para enviar pelo WhatsApp. */
export function shoppingListText(title: string, items: ShoppingItem[]): string {
  const missing = items.filter((i) => !i.have);
  const lines = missing.map((i) => `▢ ${i.name} — ${i.quantity}`);
  return `Lista de compras · ${title}\n\n${lines.join('\n')}\n\nFeita no DecideAí`;
}

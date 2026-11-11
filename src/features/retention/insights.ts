import type { DecisionEntry } from '../../stores/historyStore';
import { findRecipe } from '../food/recipes';
import { categoryLabels } from '../food/types';
import { findDemoTitle } from '../movies/catalog';
import { genreLabels } from '../movies/types';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export interface Retrospective {
  monthLabel: string;
  total: number;
  /** Categoria ou gênero que mais ganhou: "Comida japonesa ganhou 6 vezes". */
  topTag?: { label: string; count: number };
  topItem?: { title: string; count: number };
  byKind: Record<string, number>;
  /** Quantas decisões foram em grupo (salas, Match, Passa o celular). */
  together: number;
}

function tagsOf(e: DecisionEntry): string[] {
  if (e.kind === 'food') return findRecipe(e.refId)?.categories.map((c) => categoryLabels[c]) ?? [];
  if (e.kind === 'movie') return findDemoTitle(e.refId)?.genres.map((g) => genreLabels[g]) ?? [];
  return [];
}

function top(counts: Map<string, number>): { label: string; count: number } | undefined {
  let best: { label: string; count: number } | undefined;
  for (const [label, count] of counts) if (!best || count > best.count) best = { label, count };
  return best;
}

/** Resumo de um mês (padrão: o mês da data informada). */
export function monthRetrospective(entries: DecisionEntry[], ref: Date = new Date()): Retrospective {
  const month = entries.filter((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  });
  const tags = new Map<string, number>();
  const items = new Map<string, number>();
  const byKind: Record<string, number> = {};
  let together = 0;
  for (const e of month) {
    byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    items.set(e.title, (items.get(e.title) ?? 0) + 1);
    for (const t of tagsOf(e)) tags.set(t, (tags.get(t) ?? 0) + 1);
    if (/Sala|Match|Passa o celular|Batalha/.test(e.source)) together += 1;
  }
  const topItem = top(items);
  return {
    monthLabel: MONTHS[ref.getMonth()],
    total: month.length,
    topTag: top(tags),
    topItem: topItem ? { title: topItem.label, count: topItem.count } : undefined,
    byKind,
    together,
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  done: boolean;
}

/**
 * Conquistas leves, sem sequência diária obrigatória: só marcos a partir do
 * que a pessoa já fez.
 */
export function achievements(entries: DecisionEntry[]): Achievement[] {
  const count = (pred: (e: DecisionEntry) => boolean) => entries.filter(pred).length;
  const foodCats = new Set(entries.filter((e) => e.kind === 'food').flatMap((e) => findRecipe(e.refId)?.categories ?? []));
  const defs: Omit<Achievement, 'done'>[] = [
    { id: 'first-match', title: 'Primeiro match', description: 'Combinar uma opção num Match a dois', progress: count((e) => e.source === 'Match a dois'), goal: 1 },
    { id: 'ten-decisions', title: '10 decisões sem discussão', description: 'Decidir 10 vezes com o app', progress: entries.length, goal: 10 },
    { id: 'battle-champion', title: 'Campeão de batalhas', description: 'Terminar 5 batalhas', progress: count((e) => e.source.startsWith('Batalha')), goal: 5 },
    { id: 'flavor-explorer', title: 'Explorador de sabores', description: 'Decidir pratos de 6 categorias diferentes', progress: foodCats.size, goal: 6 },
    { id: 'movie-nights', title: 'Noite de cinema', description: 'Decidir 3 filmes', progress: count((e) => e.kind === 'movie'), goal: 3 },
    { id: 'together', title: 'Melhor junto', description: 'Decidir 5 vezes com outras pessoas', progress: count((e) => /Sala|Match|Passa o celular/.test(e.source)), goal: 5 },
  ];
  return defs.map((d) => ({ ...d, progress: Math.min(d.progress, d.goal), done: d.progress >= d.goal }));
}

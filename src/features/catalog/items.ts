import type { ImageSourcePropType } from 'react-native';

import { recipeSummary } from '../../components/food/RecipeTags';
import { activityById, formatMinutes } from '../activities/catalog';
import { findRecipe } from '../food/recipes';
import { findDemoTitle } from '../movies/catalog';
import { titleSummary } from '../movies/types';

export type ItemKind = 'food' | 'movie' | 'activity';

export interface ItemInfo {
  title: string;
  subtitle: string;
  image?: ImageSourcePropType;
  /** Rota da página do item no app. */
  href: { pathname: '/comer/receita/[id]' | '/filmes/[id]' | '/fazer/[id]'; params: { id: string } };
}

/** Título, imagem e página de qualquer item dos catálogos do app. */
export function itemInfo(kind: string, id: string | undefined): ItemInfo | undefined {
  if (!id) return undefined;
  if (kind === 'food') {
    const r = findRecipe(id);
    return r ? { title: r.name, subtitle: recipeSummary(r), image: r.image, href: { pathname: '/comer/receita/[id]', params: { id } } } : undefined;
  }
  if (kind === 'movie') {
    const t = findDemoTitle(id);
    return t ? { title: t.title, subtitle: titleSummary(t), image: t.image, href: { pathname: '/filmes/[id]', params: { id } } } : undefined;
  }
  if (kind === 'activity') {
    const a = activityById(id);
    return a
      ? { title: a.name, subtitle: `${formatMinutes(a.minutes)} · ${a.tags.join(' · ')}`, image: a.image, href: { pathname: '/fazer/[id]', params: { id } } }
      : undefined;
  }
  return undefined;
}

export const itemKindLabels: Record<ItemKind, string> = { food: 'Comida', movie: 'Filme', activity: 'Atividade' };

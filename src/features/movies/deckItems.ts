import type { DeckItem } from '../../components/swipe/SwipeDeck';
import { recipeSummary } from '../../components/food/RecipeTags';
import { wheelColors } from '../../theme/tokens';
import type { Recipe } from '../food/types';
import { formatDuration, genreLabels, ratingLabel, type MovieTitle } from './types';

export function movieToDeckItem(t: MovieTitle, isDemo: boolean): DeckItem {
  return {
    id: t.id,
    title: t.title,
    image: t.image,
    color: t.posterColor,
    tags: [t.kind === 'serie' ? 'Série' : 'Filme', ...t.genres.map((g) => genreLabels[g]), String(t.year), formatDuration(t), ratingLabel(t.rating)],
    text: t.synopsis,
    badge: isDemo ? 'Demonstração' : undefined,
  };
}

export function recipeToDeckItem(r: Recipe, index = 0): DeckItem {
  return {
    id: r.id,
    title: r.name,
    image: r.image,
    color: wheelColors[index % wheelColors.length],
    tags: recipeSummary(r).split(' · '),
  };
}

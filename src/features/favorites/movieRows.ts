import type { useRouter } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';

import type { Favorite } from '../../stores/favoritesStore';
import { findDemoTitle } from '../movies/catalog';
import { titleSummary } from '../movies/types';

export interface FavoriteRow {
  id: string;
  title: string;
  subtitle: string;
  image?: ImageSourcePropType;
  onPress: () => void;
}

export function favoriteMovieRows(items: Favorite[], router: ReturnType<typeof useRouter>): FavoriteRow[] {
  return items
    .filter((f) => f.kind === 'movie')
    .flatMap((f) => {
      const t = findDemoTitle(f.id);
      return t
        ? [{ id: t.id, title: t.title, subtitle: titleSummary(t), image: t.image, onPress: () => router.push({ pathname: '/filmes/[id]', params: { id: t.id } }) }]
        : [];
    });
}

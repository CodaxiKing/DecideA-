import type { useRouter } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';

import type { Favorite } from '../../stores/favoritesStore';

export interface FavoriteRow {
  id: string;
  title: string;
  subtitle: string;
  image?: ImageSourcePropType;
  onPress: () => void;
}

/** Filmes favoritos. O catálogo de filmes chega na Fase 4. */
export function favoriteMovieRows(_items: Favorite[], _router: ReturnType<typeof useRouter>): FavoriteRow[] {
  return [];
}

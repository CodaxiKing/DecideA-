import { demoTitles } from './demoCatalog';
import type { AgeRating, Genre, MovieTitle, TitleKind } from './types';
import { ageRatings } from './types';

export interface MovieFilters {
  kinds: TitleKind[];
  genres: Genre[];
  /** Duração máxima em minutos (só filmes). */
  maxMinutes?: number;
  /** "2020", "2010" ou "classicos" (antes de 2000). */
  era?: 'recentes' | 'decada' | 'classicos';
  /** Classificação indicativa máxima. */
  maxRating?: AgeRating;
}

export const emptyMovieFilters: MovieFilters = { kinds: [], genres: [] };

export function activeMovieFilterCount(f: MovieFilters): number {
  return f.kinds.length + f.genres.length + (f.maxMinutes ? 1 : 0) + (f.era ? 1 : 0) + (f.maxRating ? 1 : 0);
}

export function matchesMovieFilters(t: MovieTitle, f: MovieFilters): boolean {
  if (f.kinds.length && !f.kinds.includes(t.kind)) return false;
  if (f.genres.length && !f.genres.some((g) => t.genres.includes(g))) return false;
  if (f.maxMinutes && t.kind === 'filme' && (t.minutes ?? 0) > f.maxMinutes) return false;
  if (f.era === 'recentes' && t.year < 2020) return false;
  if (f.era === 'decada' && t.year < 2010) return false;
  if (f.era === 'classicos' && t.year >= 2000) return false;
  if (f.maxRating && ageRatings.indexOf(t.rating) > ageRatings.indexOf(f.maxRating)) return false;
  return true;
}

/**
 * Fonte de títulos, desacoplada da interface. Um provedor licenciado (com capas,
 * avaliações e plataformas de streaming) entra implementando esta interface.
 */
export interface MovieCatalogProvider {
  id: string;
  name: string;
  /** Catálogo de demonstração: a interface avisa a pessoa. */
  isDemo: boolean;
  /** Se o provedor tem dados de plataforma de streaming licenciados. */
  hasStreamingData: boolean;
  list(filters: MovieFilters): Promise<MovieTitle[]>;
  get(id: string): Promise<MovieTitle | undefined>;
}

export const demoProvider: MovieCatalogProvider = {
  id: 'demo',
  name: 'Catálogo de demonstração',
  isDemo: true,
  hasStreamingData: false,
  list: async (filters) => demoTitles.filter((t) => matchesMovieFilters(t, filters)),
  get: async (id) => demoTitles.find((t) => t.id === id),
};

/** Provedor ativo. Trocar aqui quando houver licença comercial confirmada. */
export const movieCatalog: MovieCatalogProvider = demoProvider;

/** Acesso síncrono ao catálogo local, para telas que já têm o id em mãos. */
export function findDemoTitle(id: string | undefined): MovieTitle | undefined {
  return demoTitles.find((t) => t.id === id);
}

import type { ImageSourcePropType } from 'react-native';

export type TitleKind = 'filme' | 'serie';
export type Genre = 'drama' | 'comedia' | 'terror' | 'acao' | 'romance' | 'suspense' | 'animacao' | 'documentario' | 'ficcao';
export type AgeRating = 'L' | '10' | '12' | '14' | '16' | '18';

export interface MovieTitle {
  id: string;
  title: string;
  kind: TitleKind;
  genres: Genre[];
  year: number;
  /** Duração em minutos (filmes). */
  minutes?: number;
  /** Temporadas (séries). */
  seasons?: number;
  rating: AgeRating;
  synopsis: string;
  image?: ImageSourcePropType;
  /** Cor do pôster quando não há imagem licenciada. */
  posterColor: string;
}

export type MovieVote = 'yes' | 'maybe' | 'no';

export const genreLabels: Record<Genre, string> = {
  drama: 'Drama',
  comedia: 'Comédia',
  terror: 'Terror',
  acao: 'Ação',
  romance: 'Romance',
  suspense: 'Suspense',
  animacao: 'Animação',
  documentario: 'Documentário',
  ficcao: 'Ficção científica',
};

export const ageRatings: AgeRating[] = ['L', '10', '12', '14', '16', '18'];

export function ratingLabel(r: AgeRating): string {
  return r === 'L' ? 'Livre' : `${r} anos`;
}

export function formatDuration(t: MovieTitle): string {
  if (t.kind === 'serie') return `${t.seasons ?? 1} ${t.seasons === 1 ? 'temporada' : 'temporadas'}`;
  const m = t.minutes ?? 0;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
}

export function titleSummary(t: MovieTitle): string {
  const first = t.kind === 'serie' ? 'Série' : genreLabels[t.genres[0]];
  return `${first} · ${t.year} · ${formatDuration(t)} · ${ratingLabel(t.rating)}`;
}

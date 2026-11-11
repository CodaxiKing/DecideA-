/**
 * Pacotes temáticos e temas de roleta (Fase 19, Premium).
 * Listas escritas para o DecideAí.
 */
export interface ThemePack {
  id: string;
  name: string;
  options: string[];
}

export const themePacks: ThemePack[] = [
  {
    id: 'terror',
    name: 'Noite de terror',
    options: ['Filme de terror clássico', 'Série de suspense', 'Contar histórias de medo', 'Jogo de mistério', 'Pipoca no escuro', 'Maratona de curtas', 'Caça ao tesouro com lanterna', 'Quiz de filmes de terror'],
  },
  {
    id: 'encontro',
    name: 'Primeiro encontro',
    options: ['Café numa cafeteria nova', 'Passeio no parque', 'Cinema', 'Jantar fora', 'Museu ou exposição', 'Sorvete e caminhada', 'Feira de rua', 'Mirante no pôr do sol', 'Aula experimental juntos', 'Show pequeno'],
  },
  {
    id: 'jogos',
    name: 'Noite de jogos',
    options: ['Jogo de tabuleiro', 'Cartas', 'Mímica', 'Quiz', 'Videogame cooperativo', 'Karaokê', 'Detetive', 'Stop (adedanha)', 'Imagem e ação', 'Verdade ou consequência leve'],
  },
  {
    id: 'verao',
    name: 'Férias de verão',
    options: ['Praia', 'Piscina', 'Trilha', 'Piquenique', 'Sorvete', 'Pedalar', 'Acampar no quintal', 'Cinema ao ar livre', 'Churrasco', 'Viagem curta'],
  },
];

export type WheelThemeId = 'classica' | 'meia-noite' | 'ceu';

export const wheelThemes: Record<WheelThemeId, { name: string; colors: string[]; dark: string[] }> = {
  classica: { name: 'Clássica', colors: ['#5A2BE0', '#B9A2FF', '#2159DB', '#C9DCFF', '#1B1036', '#8E6CF5'], dark: ['#B9A2FF', '#C9DCFF'] },
  'meia-noite': { name: 'Meia-noite', colors: ['#1B1036', '#352863', '#5A2BE0', '#2159DB', '#140B2A', '#8E6CF5'], dark: [] },
  ceu: { name: 'Céu', colors: ['#2159DB', '#C9DCFF', '#74A1FF', '#E8F0FF', '#1B4BB8', '#A9C6FF'], dark: ['#C9DCFF', '#E8F0FF', '#A9C6FF'] },
};

/** Cor do setor no tema, evitando o último igual ao primeiro. */
export function themeSectorColor(theme: WheelThemeId, index: number, count: number): string {
  const palette = wheelThemes[theme].colors;
  let color = palette[index % palette.length];
  if (count > 1 && index === count - 1 && color === palette[0]) color = palette[2];
  return color;
}

/** Texto escuro sobre setores claros do tema. */
export function themeTextColor(theme: WheelThemeId, fill: string): string {
  const light = theme === 'classica' ? ['#B9A2FF', '#C9DCFF'] : wheelThemes[theme].dark;
  return light.includes(fill) ? '#1B1036' : '#FFFFFF';
}

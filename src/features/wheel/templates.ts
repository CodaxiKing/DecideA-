export interface WheelTemplate {
  id: string;
  name: string;
  options: string[];
  hint?: string;
}

/** Modelos prontos da seção 5.3 do plano. */
export const wheelTemplates: WheelTemplate[] = [
  { id: 'comer', name: 'O que comer?', options: ['Pizza', 'Sushi', 'Massa', 'Lanche', 'Salada', 'Tapioca'] },
  { id: 'assistir', name: 'O que assistir?', options: ['Comédia', 'Terror', 'Drama', 'Ação', 'Romance', 'Documentário'] },
  { id: 'sair', name: 'Onde sair?', options: ['Bar', 'Cinema', 'Parque', 'Restaurante', 'Casa de amigos'] },
  { id: 'jogar', name: 'O que jogar?', options: ['Cartas', 'Tabuleiro', 'Videogame', 'Mímica', 'Quiz'] },
  {
    id: 'atividade',
    name: 'Qual atividade fazer?',
    options: ['Caminhar', 'Ler', 'Cozinhar', 'Filme em casa', 'Arrumar a casa', 'Pedalar'],
  },
  { id: 'quem', name: 'Quem começa?', options: ['Pessoa 1', 'Pessoa 2'], hint: 'Coloque os nomes de quem joga' },
];

export function templateSummary(template: WheelTemplate): string {
  if (template.hint) return template.hint;
  const head = template.options.slice(0, 3).join(', ');
  const rest = template.options.length - 3;
  return rest > 0 ? `${head} e mais ${rest}` : head;
}

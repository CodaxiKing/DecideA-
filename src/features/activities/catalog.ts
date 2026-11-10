import type { ImageSourcePropType } from 'react-native';

/**
 * Catálogo do O Que Fazer? (Fase 13). Atividades escritas para o DecideAí.
 * Fotos: Pexels (licença livre), créditos em docs/CREDITS.md.
 */
export type Company = 'sozinho' | 'casal' | 'amigos';
export type Place = 'casa' | 'fora';
export type Mood = 'relaxar' | 'rir' | 'aventura' | 'descansar';
export type TimeOfDay = 'manha' | 'tarde' | 'noite';

export interface Activity {
  id: string;
  name: string;
  description: string;
  minutes: number;
  company: Company[];
  place: Place;
  moods: Mood[];
  times: TimeOfDay[];
  /** 0 = grátis, 1 = barato, 2 = paga. */
  cost: 0 | 1 | 2;
  /** Etiquetas mostradas no cartão e usadas na memória de preferências. */
  tags: string[];
  image?: ImageSourcePropType;
}

export const companyLabels: Record<Company, string> = { sozinho: 'Sozinho', casal: 'Em casal', amigos: 'Amigos' };
export const moodLabels: Record<Mood, string> = { relaxar: 'Relaxar', rir: 'Rir', aventura: 'Se aventurar', descansar: 'Descansar' };
export const placeLabels: Record<Place, string> = { casa: 'Em casa', fora: 'Fora' };

const img = {
  piquenique: require('../../../assets/images/movies/piquenique.jpg'),
  jogos: require('../../../assets/images/movies/jogos.jpg'),
  cinema: require('../../../assets/images/movies/cinema.jpg'),
  noite: require('../../../assets/images/movies/noite.jpg'),
  ladeira: require('../../../assets/images/movies/ladeira.jpg'),
  verao: require('../../../assets/images/movies/verao.jpg'),
  mesa: require('../../../assets/images/mesa.jpg'),
  sobremesa: require('../../../assets/images/food/sobremesa.jpg'),
};

const a = (x: Omit<Activity, 'tags'> & { tags?: string[] }): Activity => ({
  ...x,
  tags: [placeLabels[x.place], ...(x.cost === 0 ? ['Grátis'] : []), ...(x.tags ?? [])],
});

export const activities: Activity[] = [
  a({ id: 'piquenique', name: 'Piquenique no parque', description: 'Leve frutas, um pano e algo para beliscar. Vale até no quintal.', minutes: 120, company: ['casal', 'amigos'], place: 'fora', moods: ['relaxar', 'descansar'], times: ['manha', 'tarde'], cost: 1, image: img.piquenique, tags: ['Ao ar livre'] }),
  a({ id: 'jogo-tabuleiro', name: 'Noite de jogos de tabuleiro', description: 'Tire da caixa aquele jogo esquecido ou improvise um de cartas.', minutes: 90, company: ['casal', 'amigos'], place: 'casa', moods: ['rir'], times: ['tarde', 'noite'], cost: 0, image: img.jogos }),
  a({ id: 'cinema', name: 'Sessão de cinema', description: 'Escolha um filme na tela grande, de preferência com pipoca.', minutes: 150, company: ['sozinho', 'casal', 'amigos'], place: 'fora', moods: ['relaxar', 'rir'], times: ['tarde', 'noite'], cost: 2, image: img.cinema }),
  a({ id: 'cinema-casa', name: 'Cinema em casa', description: 'Luz apagada, cobertor e um filme sorteado no Qual Filme?.', minutes: 120, company: ['sozinho', 'casal', 'amigos'], place: 'casa', moods: ['relaxar', 'descansar'], times: ['noite'], cost: 0, image: img.cinema }),
  a({ id: 'caminhada-noturna', name: 'Caminhada pela cidade à noite', description: 'Uma volta sem pressa por ruas que você nunca reparou.', minutes: 60, company: ['sozinho', 'casal', 'amigos'], place: 'fora', moods: ['aventura', 'relaxar'], times: ['noite'], cost: 0, image: img.noite }),
  a({ id: 'subir-mirante', name: 'Subir até um mirante', description: 'Procure o ponto mais alto do bairro e espere o pôr do sol.', minutes: 90, company: ['sozinho', 'casal', 'amigos'], place: 'fora', moods: ['aventura'], times: ['tarde'], cost: 0, image: img.ladeira, tags: ['Ao ar livre'] }),
  a({ id: 'praia-lago', name: 'Dia na praia ou no lago', description: 'Protetor solar, água e um livro. O resto o dia resolve.', minutes: 360, company: ['sozinho', 'casal', 'amigos'], place: 'fora', moods: ['relaxar', 'aventura'], times: ['manha', 'tarde'], cost: 1, image: img.verao, tags: ['Ao ar livre'] }),
  a({ id: 'cozinhar-juntos', name: 'Cozinhar algo novo juntos', description: 'Sorteie uma receita no O Que Comer? e dividam as tarefas.', minutes: 60, company: ['casal', 'amigos'], place: 'casa', moods: ['rir', 'aventura'], times: ['tarde', 'noite'], cost: 1, image: img.mesa }),
  a({ id: 'sobremesa-diferente', name: 'Preparar uma sobremesa diferente', description: 'Brigadeiro de colher, banana caramelizada ou mousse de maracujá.', minutes: 40, company: ['sozinho', 'casal', 'amigos'], place: 'casa', moods: ['relaxar'], times: ['tarde', 'noite'], cost: 1, image: img.sobremesa }),
  a({ id: 'leitura', name: 'Ler um capítulo sem celular', description: 'Escolha um livro, desligue as notificações e leia por meia hora.', minutes: 30, company: ['sozinho'], place: 'casa', moods: ['descansar', 'relaxar'], times: ['manha', 'tarde', 'noite'], cost: 0 }),
  a({ id: 'alongamento', name: 'Alongamento de 15 minutos', description: 'Pescoço, ombros, costas e pernas, devagar e respirando fundo.', minutes: 15, company: ['sozinho', 'casal'], place: 'casa', moods: ['descansar'], times: ['manha', 'noite'], cost: 0 }),
  a({ id: 'pedalar', name: 'Pedalar pela ciclovia', description: 'Bicicleta própria ou compartilhada, sem destino certo.', minutes: 60, company: ['sozinho', 'casal', 'amigos'], place: 'fora', moods: ['aventura'], times: ['manha', 'tarde'], cost: 1, tags: ['Ao ar livre'] }),
  a({ id: 'karaoke', name: 'Karaokê na sala', description: 'Uma playlist de clássicos e um microfone imaginário.', minutes: 60, company: ['casal', 'amigos'], place: 'casa', moods: ['rir'], times: ['noite'], cost: 0 }),
  a({ id: 'feira', name: 'Passear numa feira de rua', description: 'Pastel, caldo de cana e uma olhada nas barracas.', minutes: 90, company: ['sozinho', 'casal', 'amigos'], place: 'fora', moods: ['relaxar', 'aventura'], times: ['manha'], cost: 1 }),
  a({ id: 'museu', name: 'Visitar um museu ou exposição', description: 'Muitos têm dias gratuitos. Escolha um que você nunca visitou.', minutes: 120, company: ['sozinho', 'casal', 'amigos'], place: 'fora', moods: ['aventura', 'relaxar'], times: ['manha', 'tarde'], cost: 1 }),
  a({ id: 'quiz', name: 'Quiz de perguntas e respostas', description: 'Cada pessoa escreve cinco perguntas sobre o grupo.', minutes: 45, company: ['casal', 'amigos'], place: 'casa', moods: ['rir'], times: ['tarde', 'noite'], cost: 0 }),
  a({ id: 'mimica', name: 'Rodada de mímica', description: 'Filmes, músicas e ditados populares, sem falar nada.', minutes: 30, company: ['amigos'], place: 'casa', moods: ['rir'], times: ['tarde', 'noite'], cost: 0 }),
  a({ id: 'fotografar', name: 'Passeio fotográfico', description: 'Saia com o celular e fotografe só uma cor ou um tema.', minutes: 60, company: ['sozinho', 'casal'], place: 'fora', moods: ['aventura', 'relaxar'], times: ['manha', 'tarde'], cost: 0 }),
  a({ id: 'arrumar-espaco', name: 'Arrumar um cantinho da casa', description: 'Uma gaveta, uma prateleira ou o guarda-roupa. Só um.', minutes: 30, company: ['sozinho'], place: 'casa', moods: ['descansar'], times: ['manha', 'tarde'], cost: 0 }),
  a({ id: 'cafe-novo', name: 'Conhecer uma cafeteria nova', description: 'Procure uma no bairro e peça algo que nunca pediu.', minutes: 60, company: ['sozinho', 'casal', 'amigos'], place: 'fora', moods: ['relaxar'], times: ['manha', 'tarde'], cost: 2 }),
  a({ id: 'jantar-tematico', name: 'Jantar temático em casa', description: 'Escolham um país, decorem a mesa e cozinhem algo de lá.', minutes: 120, company: ['casal', 'amigos'], place: 'casa', moods: ['rir', 'aventura'], times: ['noite'], cost: 1 }),
  a({ id: 'meditar', name: 'Meditação guiada de 10 minutos', description: 'Sente confortável, feche os olhos e acompanhe a respiração.', minutes: 10, company: ['sozinho'], place: 'casa', moods: ['descansar', 'relaxar'], times: ['manha', 'noite'], cost: 0 }),
  a({ id: 'trilha', name: 'Trilha curta', description: 'Procure uma trilha leve perto de você e leve água.', minutes: 180, company: ['sozinho', 'casal', 'amigos'], place: 'fora', moods: ['aventura'], times: ['manha'], cost: 0, tags: ['Ao ar livre'] }),
  a({ id: 'videogame-coop', name: 'Videogame cooperativo', description: 'Um jogo em que vocês jogam juntos, não um contra o outro.', minutes: 90, company: ['casal', 'amigos'], place: 'casa', moods: ['rir', 'aventura'], times: ['tarde', 'noite'], cost: 0, image: img.jogos }),
  a({ id: 'conversa-perguntas', name: 'Conversa com perguntas sorteadas', description: 'Escrevam perguntas em papeizinhos e sorteiem uma por vez.', minutes: 45, company: ['casal', 'amigos'], place: 'casa', moods: ['relaxar', 'rir'], times: ['noite'], cost: 0 }),
  a({ id: 'cochilo', name: 'Cochilo de 20 minutos', description: 'Alarme ligado, celular longe e cortina fechada.', minutes: 20, company: ['sozinho'], place: 'casa', moods: ['descansar'], times: ['tarde'], cost: 0 }),
];

export function activityById(id: string | undefined): Activity | undefined {
  return activities.find((x) => x.id === id);
}

export interface ActivityFilters {
  company?: Company;
  /** Tempo disponível em minutos. */
  maxMinutes?: number;
  place?: Place;
  mood?: Mood;
}

export function matchesActivity(x: Activity, f: ActivityFilters): boolean {
  if (f.company && !x.company.includes(f.company)) return false;
  if (f.maxMinutes && x.minutes > f.maxMinutes) return false;
  if (f.place && x.place !== f.place) return false;
  if (f.mood && !x.moods.includes(f.mood)) return false;
  return true;
}

/** Hora do dia para sugestões por contexto. */
export function timeOfDay(now: Date = new Date()): TimeOfDay {
  const h = now.getHours();
  return h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
}

/** "2 h", "40 min", "1h30". */
export function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h${String(rest).padStart(2, '0')}` : `${h} h`;
}

import { cryptoSource, pickOne, type RandomSource } from '../../utils/random';
import { activities, type Company } from '../activities/catalog';
import { recipes } from '../food/recipes';
import { demoTitles } from '../movies/demoCatalog';

export type SurpriseWant = 'cozinhar' | 'sair' | 'assistir' | 'jogar';
export type SurpriseCompany = 'sozinho' | 'dupla' | 'grupo';

export interface SurpriseInput {
  minutes: number;
  company?: SurpriseCompany;
  wants: SurpriseWant[];
}

export interface Surprise {
  kind: 'food' | 'movie' | 'activity';
  id: string;
  minutes: number;
  /** Frase de abertura: "Você tem 40 minutos?" */
  hook: string;
  /** A sugestão: "Que tal preparar Bolo de cenoura?" */
  pitch: string;
}

const PLAY_IDS = new Set(['jogo-tabuleiro', 'videogame-coop', 'quiz', 'mimica', 'karaoke']);
const companyMap: Record<SurpriseCompany, Company> = { sozinho: 'sozinho', dupla: 'casal', grupo: 'amigos' };

export function hookFor(minutes: number): string {
  if (minutes < 60) return `Você tem ${minutes} minutos?`;
  const h = minutes / 60;
  return `Você tem ${h === 1 ? '1 hora' : `${h} horas`}?`;
}

/** Todas as sugestões possíveis para a entrada. */
export function surpriseCandidates(input: SurpriseInput): Surprise[] {
  const wants = input.wants.length ? input.wants : (['cozinhar', 'sair', 'assistir', 'jogar'] as SurpriseWant[]);
  const company = input.company ? companyMap[input.company] : undefined;
  const hook = hookFor(input.minutes);
  const out: Surprise[] = [];
  if (wants.includes('cozinhar')) {
    for (const r of recipes) {
      if (r.minutes > input.minutes) continue;
      const big = r.servings >= 4;
      if (input.company === 'sozinho' && r.servings > 4) continue;
      if (input.company === 'grupo' && !big) continue;
      const verb = r.categories.includes('sobremesas') ? 'preparar a sobremesa' : 'cozinhar';
      out.push({ kind: 'food', id: r.id, minutes: r.minutes, hook, pitch: `Que tal ${verb} ${r.name.toLowerCase()}?` });
    }
  }
  if (wants.includes('assistir')) {
    for (const t of demoTitles) {
      if (t.kind !== 'filme' || (t.minutes ?? 999) > input.minutes) continue;
      out.push({ kind: 'movie', id: t.id, minutes: t.minutes!, hook, pitch: `Que tal assistir ${t.title}?` });
    }
  }
  for (const a of activities) {
    if (a.minutes > input.minutes) continue;
    if (company && !a.company.includes(company)) continue;
    const isPlay = PLAY_IDS.has(a.id);
    const ok = (wants.includes('jogar') && isPlay) || (wants.includes('sair') && a.place === 'fora');
    if (!ok) continue;
    out.push({ kind: 'activity', id: a.id, minutes: a.minutes, hook, pitch: `Que tal ${a.name.charAt(0).toLowerCase()}${a.name.slice(1)}?` });
  }
  return out;
}

/**
 * Sorteia a surpresa, preferindo o que a pessoa ainda não decidiu antes
 * (é para ser inesperado). Se já viu tudo, sorteia entre todos.
 */
export function pickSurprise(input: SurpriseInput, seenIds: ReadonlySet<string>, avoidId?: string, source: RandomSource = cryptoSource): Surprise | undefined {
  let pool = surpriseCandidates(input);
  if (avoidId && pool.length > 1) pool = pool.filter((s) => s.id !== avoidId);
  const fresh = pool.filter((s) => !seenIds.has(s.id));
  const list = fresh.length ? fresh : pool;
  return list.length ? pickOne(list, source) : undefined;
}

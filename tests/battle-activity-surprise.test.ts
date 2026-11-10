import { activityPool } from '../src/features/activities/drawActivity';
import { choose, currentDuel, stageLabel, startBattle, type Battle } from '../src/features/battle/engine';
import { itemInfo } from '../src/features/catalog/items';
import { hookFor, pickSurprise, surpriseCandidates } from '../src/features/surprise/engine';
import type { RandomSource } from '../src/utils/random';

const lcg = (seed: number): RandomSource => {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
};

/** Joga uma batalha inteira escolhendo sempre o menor id. */
function playAll(b: Battle): Battle {
  let cur = b;
  let guard = 0;
  while (!cur.winner && guard++ < 100) {
    const [l, r] = currentDuel(cur)!;
    cur = choose(cur, l < r ? l : r);
  }
  return cur;
}

describe('Batalha', () => {
  it.each([2, 3, 4, 5, 6, 7, 8, 11])('com %i opções termina em n-1 duelos e vence quem sempre ganha', (n) => {
    const ids = Array.from({ length: n }, (_, i) => `o${String(i).padStart(2, '0')}`);
    const end = playAll(startBattle(ids, lcg(n)));
    expect(end.winner).toBe('o00');
    expect(end.duelsDone).toBe(n - 1);
    expect(end.totalDuels).toBe(n - 1);
  });

  it('quantidade ímpar: uma opção passa direto e isso fica registrado', () => {
    const b = startBattle(['a', 'b', 'c'], lcg(1));
    expect(b.byes).toHaveLength(1);
    expect(b.current).toHaveLength(2);
  });

  it('ignora escolha que não está no duelo', () => {
    const b = startBattle(['a', 'b', 'c', 'd'], lcg(2));
    expect(choose(b, 'zzz')).toBe(b);
  });

  it('nomeia as fases', () => {
    const b = startBattle(['a', 'b', 'c', 'd'], lcg(3));
    expect(stageLabel(b)).toBe('Semifinal');
    const [l] = currentDuel(b)!;
    const b2 = choose(b, l);
    const [l2] = currentDuel(b2)!;
    expect(stageLabel(choose(b2, l2))).toBe('Grande final');
  });

  it('recusa menos de duas opções', () => {
    expect(() => startBattle(['a'])).toThrow();
  });
});

describe('O Que Fazer? por contexto', () => {
  it('prefere o que combina com a hora, sem esvaziar', () => {
    const noite = activityPool({}, new Date(2026, 10, 10, 21));
    expect(noite.length).toBeGreaterThan(0);
    expect(noite.every((a) => a.times.includes('noite'))).toBe(true);
    // Filtro que só tem atividade de manhã: à noite ainda sugere algo.
    expect(activityPool({ mood: 'aventura', place: 'fora', maxMinutes: 180, company: 'sozinho' }, new Date(2026, 10, 10, 23)).length).toBeGreaterThan(0);
  });

  it('itens de qualquer catálogo têm título e página', () => {
    expect(itemInfo('activity', 'piquenique')?.href.pathname).toBe('/fazer/[id]');
    expect(itemInfo('food', 'bolo-cenoura')?.title).toBe('Bolo de cenoura');
    expect(itemInfo('movie', 'ultima-balsa')?.title).toBe('A Última Balsa');
    expect(itemInfo('food', 'nao-existe')).toBeUndefined();
  });
});

describe('Modo Surpresa', () => {
  it('respeita o tempo e o que a pessoa topa', () => {
    const list = surpriseCandidates({ minutes: 40, wants: ['cozinhar'] });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((s) => s.kind === 'food' && s.minutes <= 40)).toBe(true);
    expect(surpriseCandidates({ minutes: 15, wants: ['assistir'] })).toEqual([]);
  });

  it('prefere o que nunca foi decidido', () => {
    const all = surpriseCandidates({ minutes: 40, wants: ['cozinhar'] });
    const seen = new Set(all.slice(1).map((s) => s.id));
    for (let i = 0; i < 20; i++) expect(pickSurprise({ minutes: 40, wants: ['cozinhar'] }, seen)?.id).toBe(all[0].id);
  });

  it('frase de abertura', () => {
    expect(hookFor(40)).toBe('Você tem 40 minutos?');
    expect(hookFor(60)).toBe('Você tem 1 hora?');
    expect(hookFor(120)).toBe('Você tem 2 horas?');
  });
});

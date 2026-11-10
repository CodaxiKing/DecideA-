import { activeMovieFilterCount, demoProvider, emptyMovieFilters, matchesMovieFilters } from '../src/features/movies/catalog';
import { demoTitles } from '../src/features/movies/demoCatalog';
import { formatDuration, titleSummary } from '../src/features/movies/types';
import { computeGroupResult } from '../src/features/pass/engine';
import { pickFoodOptions, pickMovieOptions, PASS_OPTION_COUNT } from '../src/features/pass/options';
import { useMovieStore } from '../src/stores/movieStore';
import { usePassStore } from '../src/stores/passStore';
import type { RandomSource } from '../src/utils/random';
import { shuffle } from '../src/utils/shuffle';

const seq = (...values: number[]): RandomSource => {
  let i = 0;
  return () => values[i++ % values.length];
};
const byId = (id: string) => demoTitles.find((t) => t.id === id)!;

describe('catálogo de filmes', () => {
  it('é demonstrativo e tem ids únicos', () => {
    expect(demoProvider.isDemo).toBe(true);
    expect(new Set(demoTitles.map((t) => t.id)).size).toBe(demoTitles.length);
  });

  it('formata duração e resumo', () => {
    expect(formatDuration(byId('ultima-balsa'))).toBe('1h52');
    expect(titleSummary(byId('tres-veroes'))).toBe('Série · 2022 · 2 temporadas · 14 anos');
  });

  it('filtra por tipo, gênero, duração, época e classificação', () => {
    const f = { ...emptyMovieFilters, kinds: ['serie' as const] };
    expect(demoTitles.filter((t) => matchesMovieFilters(t, f)).every((t) => t.kind === 'serie')).toBe(true);
    expect(matchesMovieFilters(byId('noite-olinda'), { ...emptyMovieFilters, maxRating: '12' })).toBe(false);
    expect(matchesMovieFilters(byId('ladeira-abaixo'), { ...emptyMovieFilters, maxRating: '12' })).toBe(true);
    expect(matchesMovieFilters(byId('orbita-baixa'), { ...emptyMovieFilters, maxMinutes: 120 })).toBe(false);
    expect(matchesMovieFilters(byId('classico-1974'), { ...emptyMovieFilters, era: 'classicos' })).toBe(true);
    expect(matchesMovieFilters(byId('ultima-balsa'), { ...emptyMovieFilters, era: 'classicos' })).toBe(false);
    expect(matchesMovieFilters(byId('ultima-balsa'), { ...emptyMovieFilters, genres: ['terror', 'drama'] })).toBe(true);
    expect(activeMovieFilterCount({ kinds: ['filme'], genres: ['drama', 'acao'], era: 'recentes' })).toBe(4);
  });

  it('o provedor respeita os filtros', async () => {
    const list = await demoProvider.list({ ...emptyMovieFilters, genres: ['terror'] });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((t) => t.genres.includes('terror'))).toBe(true);
    expect(await demoProvider.get('nao-existe')).toBeUndefined();
  });
});

describe('shuffle', () => {
  it('mantém os mesmos itens', () => {
    const out = shuffle([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('resultado em grupo', () => {
  const ids = ['a', 'b', 'c'];

  it('unanimidade vence', () => {
    const r = computeGroupResult(ids, [
      { a: 'yes', b: 'maybe', c: 'no' },
      { a: 'yes', b: 'yes', c: 'no' },
    ]);
    expect(r.winnerId).toBe('a');
    expect(r.unanimous).toBe(true);
    expect(r.tiedIds).toEqual([]);
  });

  it('empate no topo vira sorteio entre os empatados', () => {
    const votes = [
      { a: 'yes' as const, b: 'no' as const, c: 'no' as const },
      { a: 'no' as const, b: 'yes' as const, c: 'no' as const },
    ];
    const r0 = computeGroupResult(ids, votes, seq(0));
    const r1 = computeGroupResult(ids, votes, seq(1));
    expect(r0.tiedIds.sort()).toEqual(['a', 'b']);
    expect(new Set([r0.winnerId, r1.winnerId])).toEqual(new Set(['a', 'b']));
    expect(r0.ranking[0].id).toBe(r0.winnerId);
  });

  it('com a mesma pontuação, ganha quem tem menos "não"', () => {
    const r = computeGroupResult(ids, [
      { a: 'yes', b: 'maybe', c: 'no' },
      { a: 'no', b: 'maybe', c: 'no' },
    ]);
    expect(r.winnerId).toBe('b');
  });

  it('todo mundo disse não: sem vencedor', () => {
    const r = computeGroupResult(ids, [{ a: 'no', b: 'no', c: 'no' }]);
    expect(r.winnerId).toBeUndefined();
  });

  it('voto que faltou conta como não', () => {
    const r = computeGroupResult(ids, [{ a: 'yes' }, { a: 'yes', b: 'yes' }]);
    expect(r.winnerId).toBe('a');
  });
});

describe('Passa o celular', () => {
  beforeEach(() => usePassStore.setState({ session: undefined }));

  it('passa a vez, esconde votos e calcula no fim', () => {
    const s = usePassStore.getState();
    s.start('food', ['Ana', 'Caio'], ['x', 'y']);
    s.vote('x', 'yes');
    s.vote('y', 'no');
    s.finishTurn();
    let session = usePassStore.getState().session!;
    expect(session.phase).toBe('handoff');
    expect(session.current).toBe(1);
    expect(session.result).toBeUndefined();

    // Ninguém vota durante a troca.
    s.vote('x', 'no');
    expect(usePassStore.getState().session!.votes[1]).toEqual({});

    s.beginTurn();
    s.vote('x', 'yes');
    s.vote('y', 'maybe');
    s.finishTurn();
    session = usePassStore.getState().session!;
    expect(session.phase).toBe('done');
    expect(session.result?.winnerId).toBe('x');
    expect(session.result?.unanimous).toBe(true);
  });

  it('retomada após fechar o app recomeça só a pessoa da vez', () => {
    const s = usePassStore.getState();
    s.start('movie', ['Ana', 'Caio'], ['x', 'y']);
    s.vote('x', 'yes');
    s.finishTurn();
    s.beginTurn();
    s.vote('x', 'no');
    s.restartTurn();
    const session = usePassStore.getState().session!;
    expect(session.votes[0]).toEqual({ x: 'yes' });
    expect(session.votes[1]).toEqual({});
  });

  it('escolhe 8 opções sem repetir', () => {
    const food = pickFoodOptions(['surpresa']);
    expect(food).toHaveLength(PASS_OPTION_COUNT);
    expect(new Set(food).size).toBe(food.length);
    const movies = pickMovieOptions(emptyMovieFilters);
    expect(new Set(movies).size).toBe(PASS_OPTION_COUNT);
  });

  it('usa a lista de "quero" quando houver ao menos duas', () => {
    expect(pickMovieOptions(emptyMovieFilters, ['ultima-balsa', 'ladeira-abaixo']).sort()).toEqual(['ladeira-abaixo', 'ultima-balsa']);
  });
});

describe('votos de filmes', () => {
  it('guarda, troca e apaga o voto', () => {
    useMovieStore.setState({ votes: {} });
    const { vote, clearVote } = useMovieStore.getState();
    vote('ultima-balsa', 'yes');
    vote('ultima-balsa', 'maybe');
    expect(useMovieStore.getState().votes['ultima-balsa'].vote).toBe('maybe');
    clearVote('ultima-balsa');
    expect(useMovieStore.getState().votes['ultima-balsa']).toBeUndefined();
  });
});

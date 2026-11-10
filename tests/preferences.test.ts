import { activities, activityById, formatMinutes, matchesActivity, timeOfDay } from '../src/features/activities/catalog';
import { daysUntilBack, learnedTags, recentDecisions, weightedPick, weightFor, withoutRecent } from '../src/features/preferences/engine';
import { feedbackSignal, pendingFeedback } from '../src/features/preferences/feedback';
import { smartPick } from '../src/features/preferences/smartPick';
import { usePremiumStore } from '../src/features/premium/usePremium';
import { mergeHistory, mergeSignals } from '../src/features/sync/merge';
import { useHistoryStore, type DecisionEntry } from '../src/stores/historyStore';
import { usePreferenceSignals } from '../src/stores/preferenceSignalsStore';
import type { RandomSource } from '../src/utils/random';

const now = new Date('2026-11-10T20:00:00.000Z');
const lcg = (seed: number): RandomSource => {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
};
const entry = (id: string, kind: DecisionEntry['kind'], refId: string, daysAgo: number, extra: Partial<DecisionEntry> = {}): DecisionEntry => ({
  id,
  kind,
  refId,
  title: refId,
  source: 's',
  createdAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
  ...extra,
});

describe('peso das preferências', () => {
  it('aceitar sobe, recusar desce, nunca zera nem explode', () => {
    expect(weightFor(undefined)).toBe(1);
    expect(weightFor({ accepted: 2, rejected: 0 })).toBe(2);
    expect(weightFor({ accepted: 0, rejected: 10 })).toBe(0.15);
    expect(weightFor({ accepted: 100, rejected: 0 })).toBe(4);
  });

  it('o sorteio ponderado favorece o peso maior', () => {
    const src = lcg(3);
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 6000; i++) counts[weightedPick(['a', 'b'] as const, (x) => (x === 'a' ? 3 : 1), src)!] += 1;
    expect(counts.a / counts.b).toBeGreaterThan(2.5);
    expect(counts.a / counts.b).toBeLessThan(3.5);
    expect(weightedPick([], () => 1)).toBeUndefined();
  });
});

describe('antirrepetição', () => {
  const entries = [entry('1', 'food', 'sushi', 1), entry('2', 'food', 'pizza', 10), entry('3', 'movie', 'balsa', 2)];

  it('lista só o que saiu dentro da janela e do tipo pedido', () => {
    const recent = recentDecisions(entries, 'food', 7, now);
    expect([...recent.keys()]).toEqual(['sushi']);
  });

  it('tira os recentes, mas relaxa quando não sobra nada', () => {
    const recent = recentDecisions(entries, 'food', 7, now);
    expect(withoutRecent(['sushi', 'massa'], (x) => x, recent)).toEqual(['massa']);
    expect(withoutRecent(['sushi'], (x) => x, recent)).toEqual(['sushi']);
  });

  it('diz quando o item volta', () => {
    expect(daysUntilBack(entries[0].createdAt, 7, now)).toBe(6);
  });

  it('o sorteio do app respeita a janela', () => {
    useHistoryStore.setState({ entries: [entry('x', 'food', 'a', 0)] });
    usePreferenceSignals.setState({ avoidRepeats: true, repeatDays: 7, learn: true, signals: {} });
    for (let i = 0; i < 30; i++) expect(smartPick('food', ['a', 'b'], (x) => x)).toBe('b');
    usePreferenceSignals.setState({ avoidRepeats: false });
    const seen = new Set(Array.from({ length: 60 }, () => smartPick('food', ['a', 'b'], (x) => x)));
    expect(seen).toEqual(new Set(['a', 'b']));
  });

  it('peso por gosto só no Premium', () => {
    useHistoryStore.setState({ entries: [] });
    usePreferenceSignals.setState({ avoidRepeats: false, learn: true, signals: { 'food:a': { kind: 'food', id: 'a', accepted: 0, rejected: 50, updatedAt: '' } } });
    usePremiumStore.setState({ status: { isPremium: true } });
    const picks = Array.from({ length: 400 }, () => smartPick('food', ['a', 'b'], (x) => x));
    expect(picks.filter((p) => p === 'a').length).toBeLessThan(100);
    usePremiumStore.setState({ status: { isPremium: false } });
  });
});

describe('memória', () => {
  it('não aprende quando desligada e apaga quando pedido', () => {
    usePreferenceSignals.setState({ learn: false, signals: {} });
    usePreferenceSignals.getState().record('food', 'x', 'accept');
    expect(usePreferenceSignals.getState().signals).toEqual({});
    usePreferenceSignals.setState({ learn: true });
    usePreferenceSignals.getState().record('food', 'x', 'accept', 2);
    expect(usePreferenceSignals.getState().signals['food:x'].accepted).toBe(2);
    usePreferenceSignals.getState().clear();
    expect(usePreferenceSignals.getState().signals).toEqual({});
  });

  it('agrupa o que a pessoa costuma aceitar e recusar', () => {
    const s = (id: string, accepted: number, rejected: number) => ({ kind: 'movie' as const, id, accepted, rejected, updatedAt: '' });
    const tags: Record<string, string[]> = { a: ['Comédia'], b: ['Comédia', 'Drama'], c: ['Terror'] };
    const r = learnedTags([s('a', 2, 0), s('b', 1, 0), s('c', 0, 3)], (x) => tags[x.id]);
    expect(r.liked).toEqual(['Comédia']);
    expect(r.disliked).toEqual(['Terror']);
  });
});

describe('Deu certo?', () => {
  it('pergunta só sobre decisões recentes de itens sem resposta', () => {
    const list = [entry('w', 'wheel', 'r', 0), entry('f', 'food', 'sushi', 1), entry('old', 'food', 'pizza', 5)];
    expect(pendingFeedback(list, now)?.id).toBe('f');
    expect(pendingFeedback([entry('f', 'food', 'sushi', 1, { feedback: 'liked' })], now)).toBeUndefined();
  });

  it('cada resposta pesa diferente', () => {
    expect(feedbackSignal('liked')).toEqual({ outcome: 'accept', amount: 2 });
    expect(feedbackSignal('meh')).toEqual({ outcome: 'reject', amount: 1 });
    expect(feedbackSignal('skipped')).toBeNull();
    expect(feedbackSignal('dismissed')).toBeNull();
  });
});

describe('sincronização da memória', () => {
  it('fica o sinal atualizado por último', () => {
    const local = { 'food:a': { kind: 'food' as const, id: 'a', accepted: 1, rejected: 0, updatedAt: '2026-11-10T10:00:00.000Z' } };
    const merged = mergeSignals(local, [
      { kind: 'food', id: 'a', accepted: 5, rejected: 0, updatedAt: '2026-11-10T11:00:00.000Z' },
      { kind: 'movie', id: 'b', accepted: 0, rejected: 1, updatedAt: '2026-11-09T11:00:00.000Z' },
    ]);
    expect(merged['food:a'].accepted).toBe(5);
    expect(Object.keys(merged)).toHaveLength(2);
  });

  it('a resposta do "Deu certo?" não se perde ao mesclar', () => {
    const remote = [entry('1', 'food', 'a', 1, { feedback: 'liked' })];
    const local = [entry('1', 'food', 'a', 1)];
    expect(mergeHistory(local, remote, 10)[0].feedback).toBe('liked');
  });
});

describe('catálogo de atividades', () => {
  it('ids únicos e campos completos', () => {
    expect(new Set(activities.map((a) => a.id)).size).toBe(activities.length);
    for (const a of activities) {
      expect(a.company.length && a.moods.length && a.times.length).toBeTruthy();
      expect(a.minutes).toBeGreaterThan(0);
    }
    expect(activityById('piquenique')?.tags).toContain('Fora');
  });

  it('filtra por companhia, tempo, lugar e clima', () => {
    const f = { company: 'sozinho' as const, maxMinutes: 30, place: 'casa' as const, mood: 'descansar' as const };
    const list = activities.filter((a) => matchesActivity(a, f));
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((a) => a.minutes <= 30 && a.place === 'casa' && a.company.includes('sozinho'))).toBe(true);
  });

  it('formata tempo e hora do dia', () => {
    expect(formatMinutes(40)).toBe('40 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(90)).toBe('1h30');
    expect(timeOfDay(new Date(2026, 10, 10, 9))).toBe('manha');
    expect(timeOfDay(new Date(2026, 10, 10, 20))).toBe('noite');
  });
});

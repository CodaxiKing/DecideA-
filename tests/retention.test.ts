import { achievements, monthRetrospective } from '../src/features/retention/insights';
import { defaultReminders, feedbackReminderDate, planReminders } from '../src/features/retention/reminders';
import type { DecisionEntry } from '../src/stores/historyStore';

const e = (id: string, kind: DecisionEntry['kind'], refId: string, date: string, source = 'Sorteio rápido'): DecisionEntry => ({
  id,
  kind,
  refId,
  title: refId,
  source,
  createdAt: new Date(date).toISOString(),
});

describe('lembretes', () => {
  it('tudo desligado não agenda nada', () => {
    expect(planReminders(defaultReminders)).toEqual([]);
  });

  it('jantar respeita os dias e o horário escolhidos', () => {
    const plans = planReminders({ ...defaultReminders, dinner: { enabled: true, weekdays: [2, 6, 2], hour: 20, minute: 30 } });
    expect(plans.map((p) => p.id)).toEqual(['dinner-2', 'dinner-6']);
    expect(plans[0].trigger).toEqual({ type: 'weekly', weekday: 2, hour: 20, minute: 30 });
  });

  it('cardápio no domingo e retrospectiva no dia 1, cada um desligável', () => {
    const plans = planReminders({ ...defaultReminders, weeklyMenu: { enabled: true }, monthly: { enabled: true } });
    expect(plans.find((p) => p.kind === 'weeklyMenu')?.trigger).toMatchObject({ weekday: 1, hour: 11, minute: 30 });
    expect(plans.find((p) => p.kind === 'monthly')?.trigger).toMatchObject({ type: 'monthly', day: 1 });
    expect(planReminders({ ...defaultReminders, weeklyMenu: { enabled: false }, monthly: { enabled: true } })).toHaveLength(1);
  });

  it('"Deu certo?" no dia seguinte às 10h, inclusive na virada do mês', () => {
    const d = feedbackReminderDate(new Date(2026, 10, 30, 21, 15));
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 11, 1, 10, 0]);
  });
});

describe('retrospectiva', () => {
  it('conta só o mês, acha a categoria campeã e as decisões em grupo', () => {
    const list = [
      e('1', 'food', 'temaki-salmao', '2026-11-02T20:00:00'),
      e('2', 'food', 'sunomono', '2026-11-05T20:00:00', 'Match a dois'),
      e('3', 'food', 'temaki-salmao', '2026-11-08T20:00:00', 'Sala com 3 pessoas'),
      e('4', 'movie', 'ultima-balsa', '2026-10-30T20:00:00'),
    ];
    const r = monthRetrospective(list, new Date(2026, 10, 15));
    expect(r.monthLabel).toBe('novembro');
    expect(r.total).toBe(3);
    expect(r.topTag).toEqual({ label: 'Comida japonesa', count: 3 });
    expect(r.topItem).toEqual({ title: 'temaki-salmao', count: 2 });
    expect(r.together).toBe(2);
  });
});

describe('conquistas', () => {
  it('marcos simples, sem sequência diária', () => {
    const list = [e('1', 'food', 'temaki-salmao', '2026-11-02', 'Match a dois'), e('2', 'movie', 'ultima-balsa', '2026-11-03')];
    const a = achievements(list);
    expect(a.find((x) => x.id === 'first-match')?.done).toBe(true);
    expect(a.find((x) => x.id === 'ten-decisions')).toMatchObject({ progress: 2, goal: 10, done: false });
    expect(a.find((x) => x.id === 'movie-nights')?.progress).toBe(1);
  });

  it('progresso nunca passa da meta', () => {
    const many = Array.from({ length: 15 }, (_, i) => e(String(i), 'movie', 'ultima-balsa', '2026-11-02'));
    expect(achievements(many).find((x) => x.id === 'ten-decisions')).toMatchObject({ progress: 10, done: true });
  });
});

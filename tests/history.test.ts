import { groupHistory } from '../src/features/history/groupHistory';
import { HISTORY_STORAGE_LIMIT, useHistoryStore, type DecisionEntry } from '../src/stores/historyStore';
import { useWheelStore } from '../src/stores/wheelStore';
import { formatDayLabel, formatRelativeDay } from '../src/utils/dates';

const now = new Date(2026, 10, 9, 21, 0);
const entry = (id: string, kind: DecisionEntry['kind'], date: Date): DecisionEntry => ({
  id,
  kind,
  title: id,
  source: 'teste',
  createdAt: date.toISOString(),
});

describe('datas', () => {
  it('rotula hoje, ontem e dias anteriores', () => {
    expect(formatDayLabel(new Date(2026, 10, 9, 8).toISOString(), now)).toBe('Hoje');
    expect(formatDayLabel(new Date(2026, 10, 8, 23).toISOString(), now)).toBe('Ontem');
    expect(formatDayLabel(new Date(2026, 10, 6).toISOString(), now)).toBe('Há 3 dias');
    expect(formatDayLabel(new Date(2026, 9, 12).toISOString(), now)).toBe('12/10');
    expect(formatRelativeDay(new Date(2026, 9, 12).toISOString(), now)).toBe('em 12/10');
  });
});

describe('groupHistory', () => {
  const entries = [
    entry('a', 'wheel', new Date(2026, 10, 9, 20)),
    entry('b', 'food', new Date(2026, 10, 9, 19)),
    entry('c', 'wheel', new Date(2026, 10, 8, 12)),
  ];

  it('agrupa por dia na ordem recebida', () => {
    const sections = groupHistory(entries, 'all', now);
    expect(sections.map((s) => s.label)).toEqual(['Hoje', 'Ontem']);
    expect(sections[0].entries.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('filtra por tipo', () => {
    const sections = groupHistory(entries, 'wheel', now);
    expect(sections.flatMap((s) => s.entries.map((e) => e.id))).toEqual(['a', 'c']);
  });
});

describe('historyStore', () => {
  beforeEach(() => useHistoryStore.setState({ entries: [] }));

  it('guarda a decisão mais recente primeiro e respeita o limite', () => {
    const { addEntry } = useHistoryStore.getState();
    for (let i = 0; i < HISTORY_STORAGE_LIMIT + 5; i++) addEntry({ kind: 'wheel', title: `#${i}`, source: 'Roleta' });
    const { entries } = useHistoryStore.getState();
    expect(entries).toHaveLength(HISTORY_STORAGE_LIMIT);
    expect(entries[0].title).toBe(`#${HISTORY_STORAGE_LIMIT + 4}`);
  });
});

describe('wheelStore', () => {
  beforeEach(() => useWheelStore.setState({ wheels: [] }));

  it('cria, edita, duplica, marca giro e exclui', () => {
    const s = useWheelStore.getState();
    const wheel = s.createWheel({ name: ' Jantar ', options: [{ id: '1', label: 'Pizza' }, { id: '2', label: ' ' }, { id: '3', label: 'Sushi' }] });
    expect(wheel.name).toBe('Jantar');
    expect(wheel.options).toHaveLength(2);

    s.updateWheel(wheel.id, { name: 'Jantar de sexta', options: wheel.options });
    expect(useWheelStore.getState().wheels[0].name).toBe('Jantar de sexta');

    const copy = s.duplicateWheel(wheel.id)!;
    expect(copy.id).not.toBe(wheel.id);
    expect(copy.options[0].id).not.toBe(wheel.options[0].id);
    expect(useWheelStore.getState().wheels).toHaveLength(2);

    s.markSpun(wheel.id, '2026-11-09T20:00:00.000Z');
    expect(useWheelStore.getState().wheels.find((w) => w.id === wheel.id)?.lastSpunAt).toBe('2026-11-09T20:00:00.000Z');

    s.deleteWheel(wheel.id);
    expect(useWheelStore.getState().wheels.map((w) => w.id)).toEqual([copy.id]);
  });
});

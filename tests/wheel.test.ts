import { indexAtRotation, planSpin, sectorSize } from '../src/features/wheel/spin';
import { cleanDraft, hasErrors, validateWheelDraft } from '../src/features/wheel/validation';
import { randomInt, type RandomSource } from '../src/utils/random';

/** Fonte determinística: devolve os valores em sequência, em loop. */
function seq(...values: number[]): RandomSource {
  let i = 0;
  return () => values[i++ % values.length];
}

/** Gerador pseudoaleatório simples e reprodutível para testes em massa. */
function lcg(seed: number): RandomSource {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

describe('randomInt', () => {
  it('fica sempre no intervalo e rejeita valores que causariam viés', () => {
    const top = 2 ** 32 - 1; // acima do limite de rejeição para max = 3
    expect(randomInt(3, seq(top, 7))).toBe(7 % 3);
  });

  it('distribui de forma aproximadamente uniforme', () => {
    const counts = [0, 0, 0, 0, 0, 0];
    const src = lcg(42);
    for (let i = 0; i < 60000; i++) counts[randomInt(6, src)]++;
    for (const c of counts) expect(Math.abs(c - 10000)).toBeLessThan(500);
  });

  it('recusa max inválido', () => {
    expect(() => randomInt(0)).toThrow();
  });
});

describe('indexAtRotation', () => {
  it('com a roda parada, o ponteiro está no setor 0', () => {
    expect(indexAtRotation(0, 6)).toBe(0);
  });

  it('girar 60° no horário traz o último setor para o ponteiro', () => {
    expect(indexAtRotation(30, 6)).toBe(5);
    expect(indexAtRotation(90, 6)).toBe(4);
  });
});

describe('planSpin', () => {
  it.each([2, 3, 5, 6, 7, 12, 16])('o setor sob o ponteiro é o sorteado (%i opções)', (count) => {
    const src = lcg(count);
    let rotation = 0;
    for (let k = 0; k < 500; k++) {
      const plan = planSpin(rotation, count, { source: src });
      expect(indexAtRotation(plan.targetRotation, count)).toBe(plan.index);
      expect(plan.targetRotation - rotation).toBeGreaterThanOrEqual(5 * 360);
      rotation = plan.targetRotation;
    }
  });

  it('para longe das bordas do setor', () => {
    const count = 8;
    const step = sectorSize(count);
    const src = lcg(7);
    for (let k = 0; k < 500; k++) {
      const { targetRotation } = planSpin(0, count, { source: src });
      const angle = (((-targetRotation % 360) + 360) % 360) % step;
      expect(angle).toBeGreaterThanOrEqual(step * 0.15 - 1e-6);
      expect(angle).toBeLessThanOrEqual(step * 0.85 + 1e-6);
    }
  });

  it('escolhe o índice pela fonte de aleatoriedade', () => {
    const plan = planSpin(0, 4, { source: seq(2, 0) });
    expect(plan.index).toBe(2);
  });
});

describe('validação da roleta', () => {
  const opt = (label: string, id = label || Math.random().toString()) => ({ id, label });

  it('exige nome e pelo menos duas opções preenchidas', () => {
    const errors = validateWheelDraft({ name: '  ', options: [opt('Pizza'), opt('')] });
    expect(errors.name).toBeDefined();
    expect(errors.options).toBeDefined();
    expect(hasErrors(errors)).toBe(true);
  });

  it('aceita uma roleta válida e limpa espaços e opções vazias', () => {
    const draft = { name: ' Jantar ', options: [opt(' Pizza '), opt(''), opt('Sushi')] };
    expect(hasErrors(validateWheelDraft(draft))).toBe(false);
    const clean = cleanDraft(draft);
    expect(clean.name).toBe('Jantar');
    expect(clean.options.map((o) => o.label)).toEqual(['Pizza', 'Sushi']);
  });

  it('marca opções longas demais', () => {
    const long = opt('x'.repeat(30), 'long');
    const errors = validateWheelDraft({ name: 'A', options: [long, opt('B')] });
    expect(errors.optionIds).toEqual(['long']);
  });
});

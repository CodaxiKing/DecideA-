import { themePacks, themeSectorColor, themeTextColor, wheelThemes } from '../src/features/packs/packs';

describe('pacotes temáticos', () => {
  it('cada pacote cabe numa roleta (2 a 16 opções, sem repetir)', () => {
    for (const p of themePacks) {
      expect(p.options.length).toBeGreaterThanOrEqual(2);
      expect(p.options.length).toBeLessThanOrEqual(16);
      expect(new Set(p.options).size).toBe(p.options.length);
    }
  });

  it('o último setor nunca repete a cor do primeiro', () => {
    for (const t of Object.keys(wheelThemes) as (keyof typeof wheelThemes)[]) {
      for (let n = 2; n <= 16; n++) {
        expect(themeSectorColor(t, n - 1, n)).not.toBe(themeSectorColor(t, 0, n));
      }
    }
  });

  it('texto escuro só sobre setores claros', () => {
    expect(themeTextColor('classica', '#B9A2FF')).toBe('#1B1036');
    expect(themeTextColor('classica', '#5A2BE0')).toBe('#FFFFFF');
    expect(themeTextColor('meia-noite', '#1B1036')).toBe('#FFFFFF');
    expect(themeTextColor('ceu', '#E8F0FF')).toBe('#1B1036');
  });
});

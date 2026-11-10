import { resolveScheme } from '../src/theme/resolveScheme';
import { colors } from '../src/theme/tokens';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('resolveScheme', () => {
  it('segue o sistema quando a preferência é "system"', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
    expect(resolveScheme('system', null)).toBe('light');
  });

  it('respeita a escolha explícita do usuário', () => {
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('light', 'dark')).toBe('light');
  });
});

describe.each(['light', 'dark'] as const)('contraste do tema %s', (scheme) => {
  const c = colors[scheme];
  const pairs: [string, string, string][] = [
    ['texto sobre fundo', c.text, c.background],
    ['texto de apoio sobre fundo', c.textMuted, c.background],
    ['texto de apoio sobre superfície', c.textMuted, c.surface],
    ['texto sobre roxo', c.onPrimary, c.primary],
    ['texto sobre azul', c.onBlue, c.blue],
    ['texto sobre lilás', c.onLilac, c.lilac],
    ['perigo sobre fundo', c.danger, c.background],
  ];

  it.each(pairs)('%s passa de 4,5:1', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

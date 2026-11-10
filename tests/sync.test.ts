import { mergeFavorites, mergeHistory, mergeWheels } from '../src/features/sync/merge';
import { tokenSaysAnonymous } from '../src/features/sync/syncService';
import type { Wheel } from '../src/features/wheel/types';
import { authErrorMessage, validateCredentials } from '../src/services/auth';
import { useFavoritesStore } from '../src/stores/favoritesStore';
import { useWheelStore } from '../src/stores/wheelStore';

const wheel = (id: string, updatedAt: string, extra: Partial<Wheel> = {}): Wheel => ({
  id,
  name: id,
  options: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt,
  ...extra,
});

describe('mergeWheels', () => {
  it('une por id sem duplicar e fica a edição mais recente', () => {
    const local = [wheel('a', '2026-11-10T10:00:00.000Z', { name: 'local' }), wheel('b', '2026-11-10T09:00:00.000Z')];
    const remote = [wheel('a', '2026-11-10T11:00:00.000Z', { name: 'remoto' }), wheel('c', '2026-11-10T08:00:00.000Z')];
    const merged = mergeWheels(local, remote);
    expect(merged.map((w) => w.id).sort()).toEqual(['a', 'b', 'c']);
    expect(merged.find((w) => w.id === 'a')?.name).toBe('remoto');
  });

  it('mantém o giro mais recente de qualquer lado', () => {
    const local = [wheel('a', '2026-11-10T11:00:00.000Z', { lastSpunAt: '2026-11-10T09:00:00.000Z' })];
    const remote = [wheel('a', '2026-11-10T10:00:00.000Z', { lastSpunAt: '2026-11-10T12:00:00.000Z' })];
    expect(mergeWheels(local, remote)[0].lastSpunAt).toBe('2026-11-10T12:00:00.000Z');
  });

  it('roleta apagada no aparelho não volta da conta', () => {
    expect(mergeWheels([], [wheel('a', '2026-11-10T10:00:00.000Z')], ['a'])).toEqual([]);
  });
});

describe('mergeFavorites', () => {
  it('une sem repetir e respeita removidos', () => {
    const local = [{ kind: 'food' as const, id: 'x', addedAt: '2026-11-10T10:00:00.000Z' }];
    const remote = [
      { kind: 'food' as const, id: 'x', addedAt: '2026-11-09T10:00:00.000Z' },
      { kind: 'movie' as const, id: 'x', addedAt: '2026-11-09T10:00:00.000Z' },
      { kind: 'food' as const, id: 'y', addedAt: '2026-11-08T10:00:00.000Z' },
    ];
    const merged = mergeFavorites(local, remote, [{ kind: 'food', id: 'y' }]);
    expect(merged).toHaveLength(2);
    expect(merged.find((f) => f.kind === 'food')?.addedAt).toBe('2026-11-09T10:00:00.000Z');
  });
});

describe('mergeHistory', () => {
  it('une por id, ordena e corta no limite', () => {
    const e = (id: string, at: string) => ({ id, kind: 'wheel' as const, title: id, source: 's', createdAt: at });
    const merged = mergeHistory([e('1', '2026-11-10T10:00:00.000Z'), e('2', '2026-11-10T12:00:00.000Z')], [e('1', '2026-11-10T10:00:00.000Z'), e('3', '2026-11-10T11:00:00.000Z')], 2);
    expect(merged.map((x) => x.id)).toEqual(['2', '3']);
  });
});

describe('tombstones locais', () => {
  it('apagar roleta e desfavoritar ficam pendentes para a conta', () => {
    useWheelStore.setState({ wheels: [wheel('a', '2026-11-10T10:00:00.000Z')], deletedIds: [] });
    useWheelStore.getState().deleteWheel('a');
    expect(useWheelStore.getState().deletedIds).toEqual(['a']);

    useFavoritesStore.setState({ items: [], removed: [] });
    useFavoritesStore.getState().toggle('food', 'x');
    useFavoritesStore.getState().toggle('food', 'x');
    expect(useFavoritesStore.getState().removed).toEqual([{ kind: 'food', id: 'x' }]);
    useFavoritesStore.getState().toggle('food', 'x');
    expect(useFavoritesStore.getState().removed).toEqual([]);
  });
});

describe('validação de conta', () => {
  it('exige e-mail válido e senha de 8 caracteres', () => {
    expect(validateCredentials('ana', '12345678')).toBeDefined();
    expect(validateCredentials('ana@exemplo.com', '1234')).toBeDefined();
    expect(validateCredentials(' ana@exemplo.com ', '12345678')).toBeUndefined();
  });

  it('traduz erros comuns de autenticação', () => {
    expect(authErrorMessage(new Error('Invalid login credentials'))).toBe('E-mail ou senha incorretos.');
    expect(authErrorMessage(new Error('User already registered'))).toMatch(/Já existe/);
  });
});

describe('token anônimo antigo', () => {
  const jwt = (payload: object) => `x.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.y`;
  it('detecta is_anonymous no token', () => {
    expect(tokenSaysAnonymous(jwt({ is_anonymous: true }))).toBe(true);
    expect(tokenSaysAnonymous(jwt({ is_anonymous: false }))).toBe(false);
    expect(tokenSaysAnonymous('lixo')).toBe(false);
  });
});

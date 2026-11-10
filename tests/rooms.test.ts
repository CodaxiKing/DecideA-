import { isRoomExpired, normalizeRoomCode, roomErrorMessage, ROOM_CODE_PATTERN, type Room } from '../src/features/rooms/types';

const room = (over: Partial<Room>): Room => ({
  id: 'r',
  code: 'K7M2QX',
  host_id: 'h',
  item_type: 'food',
  decision_mode: 'vote',
  status: 'lobby',
  max_participants: 4,
  vetoes_per_person: 0,
  battle_state: null,
  expires_at: '2026-11-10T12:30:00Z',
  created_at: '2026-11-10T12:00:00Z',
  closed_at: null,
  ...over,
});

describe('código de sala', () => {
  it('normaliza o que a pessoa digita', () => {
    expect(normalizeRoomCode(' k7m-2qx ')).toBe('K7M2QX');
    expect(normalizeRoomCode('abcdefgh')).toBe('ABCDEF');
  });

  it('aceita só o alfabeto sem letras ambíguas', () => {
    expect(ROOM_CODE_PATTERN.test('K7M2QX')).toBe(true);
    expect(ROOM_CODE_PATTERN.test('K7M2Q0')).toBe(false); // zero
    expect(ROOM_CODE_PATTERN.test('IOIOIO')).toBe(false);
  });
});

describe('expiração', () => {
  it('sala aberta depois do prazo está expirada; fechada não', () => {
    const now = new Date('2026-11-10T12:31:00Z');
    expect(isRoomExpired(room({}), now)).toBe(true);
    expect(isRoomExpired(room({ status: 'closed' }), now)).toBe(false);
    expect(isRoomExpired(room({}), new Date('2026-11-10T12:10:00Z'))).toBe(false);
  });
});

describe('mensagens de erro', () => {
  it('traduz erros do servidor sem expor detalhes', () => {
    expect(roomErrorMessage(new Error('room_full'))).toBe('Essa sala está cheia.');
    expect(roomErrorMessage({ message: 'TypeError: Network request failed' })).toMatch(/Sem conexão/);
    expect(roomErrorMessage(new Error('duplicate key value violates unique constraint "x"'))).toBe('Algo deu errado. Tente de novo.');
  });
});

describe('amigos: rótulos', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { lastSeenLabel, personName } = require('../src/features/friends/useSocial') as typeof import('../src/features/friends/useSocial');
  const now = new Date('2026-11-10T20:00:00.000Z');

  it('visto por último', () => {
    expect(lastSeenLabel(null, now)).toBe('Offline');
    expect(lastSeenLabel('2026-11-10T19:50:00.000Z', now)).toBe('Visto há 10 min');
    expect(lastSeenLabel('2026-11-10T18:00:00.000Z', now)).toBe('Visto há 2 h');
    expect(lastSeenLabel('2026-11-09T19:00:00.000Z', now)).toBe('Visto ontem');
    expect(lastSeenLabel('2026-11-06T19:00:00.000Z', now)).toBe('Visto há 4 dias');
  });

  it('nome de exibição', () => {
    expect(personName({ display_name: 'Bia', username: 'bia_1' })).toBe('Bia');
    expect(personName({ display_name: null, username: 'bia_1' })).toBe('@bia_1');
    expect(personName({ display_name: null, username: null })).toBe('Alguém');
  });
});

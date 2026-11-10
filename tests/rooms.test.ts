import { isRoomExpired, normalizeRoomCode, roomErrorMessage, ROOM_CODE_PATTERN, type Room } from '../src/features/rooms/types';

const room = (over: Partial<Room>): Room => ({
  id: 'r',
  code: 'K7M2QX',
  host_id: 'h',
  item_type: 'food',
  decision_mode: 'vote',
  status: 'lobby',
  max_participants: 4,
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

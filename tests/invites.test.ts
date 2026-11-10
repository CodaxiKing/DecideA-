import { inviteMessage } from '../src/features/rooms/inviteLink';

jest.mock('expo-linking', () => ({ createURL: (path: string) => `decideai://${path.replace(/^\//, '')}` }));

describe('link de convite', () => {
  const load = () => {
    let mod!: typeof import('../src/features/rooms/inviteLink');
    jest.isolateModules(() => {
      mod = require('../src/features/rooms/inviteLink');
    });
    return mod;
  };

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_WEB_URL;
  });

  it('sem domínio, usa o link do app', () => {
    const m = load();
    expect(m.hasWebInvites).toBe(false);
    expect(m.inviteLink('abc')).toBe('decideai://convite/abc');
  });

  it('com domínio, usa a página web (sem barra dupla)', () => {
    process.env.EXPO_PUBLIC_WEB_URL = 'https://decideai.example/';
    const m = load();
    expect(m.hasWebInvites).toBe(true);
    expect(m.inviteLink('abc')).toBe('https://decideai.example/convite/abc');
  });

  it('mensagem traz o link e o código', () => {
    const msg = inviteMessage('https://x/convite/abc', 'K7M2QX', true);
    expect(msg).toContain('Match');
    expect(msg).toContain('https://x/convite/abc');
    expect(msg).toContain('K7M2QX');
  });
});

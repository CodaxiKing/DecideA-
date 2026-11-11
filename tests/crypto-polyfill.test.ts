describe('polyfill do PKCE', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  afterAll(() => {
    if (original) Object.defineProperty(globalThis, 'crypto', original);
  });

  it('instala SHA-256 quando o motor não tem crypto.subtle', async () => {
    Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true, writable: true });
    const { installCryptoPolyfill } = require('../src/services/cryptoPolyfill');
    installCryptoPolyfill();
    const c = (globalThis as unknown as { crypto: Crypto }).crypto;
    const hash = await c.subtle.digest('SHA-256', new TextEncoder().encode('abc'));
    const hex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
    expect(hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(typeof c.getRandomValues).toBe('function');
  });
});

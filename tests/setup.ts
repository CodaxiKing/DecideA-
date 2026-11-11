jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// O módulo nativo do expo-crypto não existe no Jest; usa o crypto do Node.
jest.mock('expo-crypto', () => {
  const nodeCrypto = require('node:crypto');
  return {
    randomUUID: () => nodeCrypto.randomUUID(),
    getRandomValues: <T extends Uint32Array>(array: T) => nodeCrypto.getRandomValues(array),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (_alg: string, data: Uint8Array) => {
      const b = nodeCrypto.createHash('sha256').update(new Uint8Array(data)).digest();
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    },
  };
});

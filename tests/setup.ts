jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// O módulo nativo do expo-crypto não existe no Jest; usa o crypto do Node.
jest.mock('expo-crypto', () => {
  const nodeCrypto = require('node:crypto');
  return {
    randomUUID: () => nodeCrypto.randomUUID(),
    getRandomValues: <T extends Uint32Array>(array: T) => nodeCrypto.getRandomValues(array),
  };
});

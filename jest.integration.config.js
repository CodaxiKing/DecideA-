/** Testes de integração contra o Supabase local. Precisa de `npx supabase start`. */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo/node',
  roots: ['<rootDir>/tests-integration'],
  testEnvironment: 'node',
};

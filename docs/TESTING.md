# Testes

| Comando | O que verifica |
|---|---|
| `npm run typecheck` | TypeScript em modo strict |
| `npm run lint` | ESLint com `eslint-config-expo` |
| `npm test` | Jest com `jest-expo` e Testing Library |
| `npm run test:integration` | Salas contra o Supabase local, com dois clientes (ver `docs/DATABASE.md`) |

Os testes ficam em `tests/`. O `tests/setup.ts` troca o AsyncStorage pelo mock oficial.

## Cobertura atual

- `tests/theme.test.ts`: escolha do tema (sistema, claro, escuro) e contraste mínimo de 4,5:1 nos pares de cor dos dois temas.
- `tests/ui.test.tsx`: o cartão da tela inicial é um botão acessível; a tela Perfil troca e guarda o tema.

## Último resultado

2026-11-09: TypeScript sem erros, lint sem avisos, 18 testes passando em 2 suítes, `expo-doctor` com 20 de 20 verificações e bundle Android exportado sem erro.

Os testes de cada fase seguem a lista da [seção 13 do plano](../plan.md#13-testes-e-qualidade).

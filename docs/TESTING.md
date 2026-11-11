# Testes

| Comando | O que verifica |
|---|---|
| `npm run typecheck` | TypeScript em modo strict |
| `npm run lint` | ESLint com `eslint-config-expo` |
| `npm test` | Testes unitários (Jest com `jest-expo` e Testing Library) |
| `npm run test:integration` | Salas, contas e Premium contra o Supabase local |
| `npx expo-doctor` | Dependências e configuração do Expo |

## Unitários (`tests/`)

O `tests/setup.ts` troca o AsyncStorage e o `expo-crypto` por versões de teste.

| Arquivo | Cobre |
|---|---|
| `theme.test.ts` | Escolha do tema e contraste de 4,5:1 nos dois temas |
| `ui.test.tsx` | Cartão da tela inicial acessível; troca de tema no Perfil |
| `wheel.test.ts` | Sorteio sem viés, setor sob o ponteiro = sorteado (2 a 16 opções), parada longe das bordas, validação |
| `history.test.ts` | Datas, agrupamento e filtro do histórico, limite, stores de roleta |
| `food.test.ts` | Catálogo, normalização de ingredientes, filtros, sorteio sem repetir, "tenho estes ingredientes" |
| `movies-pass.test.ts` | Catálogo e filtros de filmes, resultado em grupo (unanimidade, empate, "não"), Passa o celular (troca, sigilo, retomada) |
| `rooms.test.ts` | Código de sala, expiração, mensagens de erro |
| `sync.test.ts` | Mesclagem de roletas, favoritos e histórico; exclusões pendentes; token anônimo antigo; validação de conta |
| `premium.test.ts` | Limites, loja indisponível sem compra simulada, regras do webhook do RevenueCat |
| `packs.test.ts` | Pacotes cabem numa roleta, cores dos temas, contraste do texto |
| `crypto-polyfill.test.ts` | SHA-256 do PKCE quando o motor não tem `crypto.subtle` |

## Integração (`tests-integration/`)

Precisam do Supabase local (`npm run db:start`) e das variáveis:

```bash
eval "$(npx supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
```

```bash
SUPABASE_URL="$API_URL" SUPABASE_ANON_KEY="$ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" npm run test:integration
```

`SERVICE_ROLE_KEY` só existe no ambiente local de teste e nunca vai para o app.

| Arquivo | Cobre |
|---|---|
| `rooms.int.test.ts` | Dois aparelhos: criar, entrar, votar, resultado igual para os dois; votos secretos; reentrada; sala cheia; código errado; sala iniciada; saída no meio; encerramento pelo anfitrião; escrita direta bloqueada; tempo real |
| `accounts.int.test.ts` | Dois aparelhos na mesma conta sem duplicar; edição mais nova vence; isolamento entre contas; convidado bloqueado; convidado vira conta; exclusão de conta |
| `entitlements.int.test.ts` | Sala grátis limitada no servidor; app não se dá Premium; direito ativo e expirado |

Logo depois de `db:start`, o serviço de tempo real pode levar alguns segundos para aceitar conexões; se só o teste de tempo real falhar, rode de novo.

## Manuais no emulador

Cada fase registra em `docs/DEVELOPMENT_PLAN.md` o que foi conferido no emulador Android (API 36).

## Último resultado

2026-11-10: TypeScript e lint sem erros, 155 testes unitários em 16 suítes, 31 testes de integração em 4 suítes, `expo-doctor` com 20 de 20 verificações.

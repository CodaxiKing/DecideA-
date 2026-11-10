# Arquitetura

Monólito modular em React Native com Expo, com Supabase como backend. As ferramentas individuais funcionam só com dados locais; salas, contas e Premium usam o servidor.

## Versões

| Peça | Versão |
|---|---|
| Expo SDK | 58 |
| React Native | 0.88 |
| React | 19.3 |
| TypeScript | 6.0, modo strict |
| Supabase JS | 2.119 |
| RevenueCat (react-native-purchases) | 11 |

Sempre instalar dependências com `npx expo install`, que escolhe a versão compatível com a SDK.

## Camadas

```text
src/app/           rotas finas: cada arquivo só reexporta uma tela de features/
src/features/      telas e regras por módulo (wheel, food, movies, pass, rooms, account, sync, premium, history)
src/components/    componentes visuais sem regra de negócio (ui/, swipe/, wheel/, food/, movies/)
src/repositories/  acesso ao Supabase (salas, sincronização); recebem o cliente por parâmetro
src/services/      cliente Supabase, autenticação e assinaturas
src/stores/        estado local (Zustand + AsyncStorage)
src/theme/         tokens, resolução do tema e ThemeProvider
src/utils/         aleatoriedade, datas, embaralhamento
supabase/          migrações, configuração local e Edge Functions
```

Regras:

- Rotas não têm lógica. A tela fica em `src/features/<módulo>/`.
- Componentes de `components/` não conhecem stores nem rotas, com exceção do `FavoriteButton`.
- Nenhuma cor, raio ou espaço fora de `src/theme/tokens.ts`.
- Regras (sorteio, filtros, resultado em grupo, mesclagem, limites) ficam em funções puras e testadas.
- Toda aleatoriedade passa por `src/utils/random.ts` (`expo-crypto`, sem viés de módulo), com fonte injetável nos testes.

## Dados

| Onde | O quê |
|---|---|
| Aparelho (AsyncStorage) | Preferências, roletas, favoritos, histórico, votos de filmes, Passa o celular, nome |
| Supabase | Salas (Fase 5), conta e sincronização (Fase 6), direito Premium (Fase 7) |
| RevenueCat | Assinaturas |

Detalhes do banco em [DATABASE.md](DATABASE.md) e de monetização em [MONETIZATION.md](MONETIZATION.md).

## Fluxos principais

- **Roleta:** o sorteio acontece antes da animação e o ângulo final é derivado do resultado (`features/wheel/spin.ts`).
- **Cartões de votação:** `components/swipe/SwipeDeck.tsx` serve a filmes, Passa o celular e salas.
- **Salas:** o app só lê; toda escrita é por funções no banco, que também calculam o resultado. TanStack Query guarda o estado da sala e o Realtime avisa mudanças.
- **Sincronização:** `features/sync/syncService.ts` apaga pendências, traz a conta, mescla por id e envia. Roda ao entrar, ao voltar ao app e após mudanças.
- **Premium:** `features/premium/usePremium.ts` mantém o estado só em memória, a partir do `SubscriptionService`.

## Navegação

- `src/app/_layout.tsx`: fontes, splash, providers (gestos, área segura, TanStack Query, tema), sincronização, Premium e tela de erro.
- `src/app/(tabs)/`: Início, Favoritos, Histórico e Perfil.
- Pilhas por módulo: `roleta/`, `comer/`, `filmes/`, `passa/`, `sala/`, `conta/`, `premium/`.
- Links: esquema `decideai://` (convites de sala e recuperação de senha).

## Builds

- **Expo Go:** tudo menos compras.
- **Development build** (`expo-dev-client`): necessário para o RevenueCat.
- **EAS:** perfis `development`, `preview` (APK interno) e `production` (AAB) em `eas.json`.

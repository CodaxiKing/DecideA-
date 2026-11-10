# Arquitetura

Monólito modular em React Native com Expo. O backend (Supabase) entra na Fase 5; até lá o app funciona só com dados locais.

## Versões

| Peça | Versão |
|---|---|
| Expo SDK | 58 |
| React Native | 0.88 |
| React | 19.3 |
| TypeScript | 6.0, modo strict |
| Expo Router | 58 |

Sempre instalar dependências com `npx expo install`, que escolhe a versão compatível com a SDK.

## Camadas

```text
src/app/          rotas finas: cada arquivo só reexporta uma tela de features/
src/features/     telas e lógica por módulo (home, preferences, depois wheel, food...)
src/components/ui componentes visuais sem regra de negócio
src/theme/        tokens, resolução do tema e ThemeProvider
src/stores/       estado local (Zustand + AsyncStorage)
```

Regras:

- Rotas não têm lógica. A tela fica em `src/features/<módulo>/`.
- Componentes de `components/ui` não conhecem stores nem rotas; recebem tudo por props.
- Nenhuma cor, raio ou espaço fora de `src/theme/tokens.ts`.
- Lógica de sorteio e regras ficam em funções puras, testáveis sem renderizar nada.

## Navegação

- `src/app/_layout.tsx`: carrega as fontes, segura a splash, monta os providers (gestos, área segura, tema) e a pilha principal.
- `src/app/(tabs)/`: barra inferior com Início, Favoritos, Histórico e Perfil, como no canvas.
- `src/app/comer.tsx`, `filmes.tsx`, `roleta.tsx`: as três seções, abertas por cima das abas.

## Tema

`ThemeProvider` junta a preferência guardada (`system`, `light` ou `dark`) com o tema do sistema por `resolveScheme`. A preferência fica em AsyncStorage pela store `decideai.preferences` e é trocada na tela Perfil.

## Fontes

Bricolage Grotesque 700 para títulos e Figtree 400, 500 e 600 para texto, pelos pacotes `@expo-google-fonts`, sob licença OFL. A splash só some quando as fontes carregam (ou falham, para não travar o app).

## Dependências já instaladas para fases seguintes

- `react-native-reanimated` e `react-native-worklets`: animação da roleta (Fase 2).
- `react-native-gesture-handler`: já envolve o app; gestos da roleta e do swipe.

Ainda não instaladas, por não serem usadas: TanStack Query, Supabase, RevenueCat, Expo Notifications, React Hook Form e Zod.

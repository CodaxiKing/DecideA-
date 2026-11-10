# Andamento

Checklist de implementação. O escopo de cada fase está no [plano mestre](../plan.md#14-fases-de-execução).

## Fase 1: Fundação

- [x] Projeto Expo SDK 58 com TypeScript strict
- [x] Expo Router com abas (Início, Favoritos, Histórico, Perfil) e rotas das três seções
- [x] Design tokens de cor, tipografia, raio, espaço e sombra
- [x] Tema claro e escuro, com escolha guardada no aparelho
- [x] Fontes Bricolage Grotesque e Figtree
- [x] Tela inicial com os cartões de O Que Comer?, Qual Filme? e Roleta
- [x] Componentes: `AppText`, `AppButton`, `AppCard`, `AppBadge`, `FilterChip`, `EmptyState`, `LoadingState`, `DecisionTile`, `Screen`, `BrandMark`, `WheelArt`, `TabIcon`
- [x] ESLint, Jest e Testing Library configurados
- [x] Conferido no emulador Android (API 36, Expo Go 58): tela inicial, abas, seções e tema escuro, que continua depois de reabrir o app

Ficaram para as fases que os usam: `AppModal`, `AppBottomSheet`, `AppInput`, `AppHeader`, `PremiumBadge` e `DecisionResultCard`. O cartão "Decidir em grupo" e o botão "Entrar" da tela inicial entram com as Fases 5 e 6, para não mostrar botões que ainda não fazem nada.

## Fase 2: Roleta

- [ ] Não iniciada

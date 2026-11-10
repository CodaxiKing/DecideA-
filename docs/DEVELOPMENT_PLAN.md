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

- [x] Criar, editar, duplicar e excluir roletas, guardadas no aparelho (`decideai.wheels`)
- [x] Seis modelos prontos e roleta em branco
- [x] Sorteio com `expo-crypto` sem viés de módulo; o ângulo final é derivado do resultado (`src/features/wheel/spin.ts`)
- [x] Animação com Reanimated, desaceleração progressiva e giro instantâneo com movimento reduzido
- [x] Vibração opcional (`expo-haptics`), guardada nas preferências
- [x] Resultado com o cartão da marca e compartilhamento pelo menu do sistema
- [x] Histórico de decisões com filtro por tipo e agrupado por dia (`decideai.history`)
- [x] Conferido no emulador: modelo → salvar → girar → resultado bate com o setor → histórico
- [ ] Som ao girar: pendente, falta um efeito sonoro com licença livre
- [ ] Limite de 3 roletas no plano grátis: entra com o Premium (Fase 7)

## Fase 3: Comidas

- [x] Catálogo local com 24 receitas completas (ingredientes, quantidades, preparo, tempo, dificuldade, porções, categorias, refeições e restrições), sem IA (`src/features/food/recipes.ts`)
- [x] Sorteio rápido por categoria, Vegetarianas e Surpreenda-me, sem repetir o prato anterior quando há outro
- [x] Filtros de tempo, refeição, restrições e ingredientes a evitar
- [x] Tenho estes ingredientes: cruza o que a pessoa tem com o catálogo, ignorando acento, plural e sinônimos, e diz o que falta
- [x] Receita completa com compartilhamento em texto
- [x] Favoritos de pratos guardados no aparelho (`decideai.favorites`)
- [x] Sorteios entram no histórico
- [x] Conferido no emulador: sortear → resultado → favoritar → receita; ingredientes; aba Favoritos
- [ ] Decisão em grupo pelo O Que Comer?: entra com as salas (Fase 5)
- [ ] Salvar filtros para a próxima vez e limite de 20 favoritos: Premium (Fase 7)

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

## Fase 4: Filmes e Passa o celular

- [x] Interface `MovieCatalogProvider` desacoplada da tela, com provedor demonstrativo de 22 títulos fictícios (sem dados nem capas sem licença), identificado na tela
- [x] `SwipeDeck` reutilizável: arrastar para a direita (quero), esquerda (não) e para cima (talvez), botões sempre visíveis e troca sem animação com movimento reduzido
- [x] Filtros de tipo, gênero, duração, época e classificação indicativa; aviso de que plataforma de streaming depende de catálogo licenciado
- [x] Meus votos (quero, talvez, não) guardados no aparelho e página do título com troca de voto
- [x] Favoritos de filmes na aba Favoritos
- [x] Passa o celular: 2 a 8 pessoas, comida ou filme, 8 opções iguais para todos, votos escondidos até o fim, retomada após fechar o app (a pessoa da vez recomeça), resultado com unanimidade, empate por sorteio e ranking
- [x] Conferido no emulador: arrastar cartão, votar por botões, fluxo completo do Passa o celular com duas pessoas
- [ ] Vetos no Passa o celular: entram com o Match (Fase 10)
- [ ] Catálogo licenciado: depende de contrato com um provedor (ver riscos no plano)

## Fase 5: Backend e salas

- [x] Supabase local pela CLI (Docker), portas 544xx, login anônimo ligado
- [x] Migração das salas com RLS, votos secretos e escrita só por funções no servidor (`docs/DATABASE.md`)
- [x] Resultado calculado no banco, com desempate por sorteio, saída de participante e encerramento pelo anfitrião
- [x] Código difícil de adivinhar, expiração de 30 min, limite de 4 pessoas no grátis, limite de criação por hora
- [x] App: criar sala, entrar por código ou link (`decideai://sala/entrar?codigo=`), sala de espera, votação com o `SwipeDeck`, espera pelos outros e resultado ao mesmo tempo para todos, em tempo real com TanStack Query
- [x] Modo local claramente identificado quando o app não tem servidor configurado
- [x] 7 testes de integração com dois aparelhos simulados contra o Supabase local
- [x] Conferido no emulador: Ana criou a sala no app, Caio entrou por um segundo cliente, os dois votaram e o resultado chegou aos dois
- [ ] Projeto Supabase na nuvem: pendente de conta e autorização (custo)
- [ ] Rodada final como desempate: hoje o empate vai para sorteio

## Fase 6: Contas

- [x] Conta opcional com e-mail e senha (Supabase Auth); uso sem cadastro continua igual
- [x] Convidado anônimo das salas vira conta sem trocar de usuário
- [x] Recuperação de senha por link e tela de nova senha
- [x] Sair, apagar dados deste aparelho e excluir conta (apaga tudo no servidor em cascata)
- [x] Sincronização de roletas, favoritos e histórico: ao entrar, ao voltar ao app e alguns segundos depois de cada mudança; migra os dados de quem usava sem conta, sem duplicar
- [x] 5 testes de integração (dois aparelhos na mesma conta, isolamento entre contas, convidado bloqueado, conversão de convidado, exclusão de conta)
- [x] Conferido no emulador: criar conta → roleta, favorito e 6 decisões chegaram ao banco
- [ ] PKCE usa o método `plain` porque o Expo Go não tem WebCrypto; avaliar um polyfill de `crypto.subtle` no development build
- [ ] Envio real de e-mail (recuperação de senha): no local vai para o Inbucket; na nuvem precisa de SMTP próprio

## Fase 7: Premium

- [x] Limites do plano grátis: 3 roletas, 20 favoritos, 10 decisões no histórico, salas de 4 pessoas por 30 min
- [x] Tela Premium com comparação de planos, preços vindos da loja, restaurar compras e Premium Dupla como "em breve"
- [x] `SubscriptionService` com adaptador do RevenueCat e modo "loja indisponível" sem compra simulada
- [x] Estado Premium só em memória, consultado a cada abertura e atualizado por renovação, cancelamento e expiração
- [x] Direito Premium no servidor (`user_entitlements`), gravado só pelo webhook; salas usam esse direito para tamanho e duração
- [x] Webhook do RevenueCat (Edge Function) com regras testadas: compra e renovação liberam, cancelamento vale até expirar, expiração remove
- [x] 3 testes de integração: sala grátis limitada mesmo pedindo mais, app não se dá Premium, direito ativo e expirado
- [x] Conferido no emulador: tela Premium mostra "Loja indisponível" com o motivo
- [ ] Compras de teste: dependem de conta RevenueCat, produtos na Play Console e development build (ver `docs/MONETIZATION.md`)
- [ ] Salvar filtros e preferências: entra com as preferências inteligentes (Fase 9)

## Fase 8: Lançamento

- [x] Ícone adaptativo, ícone principal, favicon e splash com a marca (gerados a partir de `assets/brand/mark.svg`)
- [x] Tela de erro amigável para falhas inesperadas
- [x] Perfis do EAS (`eas.json`) e `expo-dev-client` para development build
- [x] Política de privacidade (rascunho para revisão jurídica), texto da loja e formulário de segurança de dados
- [x] Checklist de lançamento (`docs/RELEASE_CHECKLIST.md`)
- [x] `expo-doctor` 20/20, TypeScript, lint e testes passando
- [ ] APK local: bloqueado pelo `ninja` 1.10 do Android SDK com caminhos longos no Windows (ver checklist)
- [ ] Teste em celular real e com TalkBack

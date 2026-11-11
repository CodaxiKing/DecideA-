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
- [x] APK de release local gerado (ninja 1.12.1 no Android SDK) e validado no emulador
- [ ] Teste em celular real e com TalkBack

## Fase 9: Preferências

- [x] Memória de preferências local (`decideai.preference-signals`): votos de filmes, favoritos, "Sortear outra" e "Deu certo?" viram sinais de aceite e recusa
- [x] Antirrepetição em todos os planos, com janela de 3, 7 ou 30 dias, relaxando quando o catálogo é pequeno
- [x] Sorteio ponderado pelo gosto e ordem dos cartões de filmes pelo gosto, no Premium ("preferências inteligentes")
- [x] "Deu certo?" na tela inicial para decisões dos últimos 3 dias
- [x] Tela Suas preferências: ligar e desligar o aprendizado, janela de repetição, o que costuma aceitar e recusar, o que está "sem repetir" e apagar tudo (também na conta)
- [x] Sincronização dos sinais (`preference_signals`) e da resposta do "Deu certo?" (`decision_history.feedback`)
- [x] Catálogo de 26 atividades para o O Que Fazer? (usado a partir da Fase 13)
- [x] Conferido no emulador: cartão "Deu certo?" → resposta salva na conta → tela de preferências

## Fase 10: Match a dois e veto

- [x] Salas com modo `match` (sempre 2 pessoas): só vale o que os dois marcaram "quero"; com várias combinações, o servidor sorteia uma
- [x] Sem match: tela com "Nova rodada"
- [x] Vetos configuráveis (0, 1 ou 2 por pessoa), validados no servidor (`cast_veto`, tabela `room_vetoes`), secretos até o resultado
- [x] Opção vetada nunca vence, nem na votação em grupo
- [x] Vetos também no Passa o celular
- [x] Salas e Passa o celular aceitam atividades (base da Fase 13)
- [x] `SwipeDeck` com botão Vetar e modo sem "talvez"
- [x] 2 testes de integração (Match com veto e limite de 2 pessoas; Match sem combinação)
- [x] Conferido no emulador: Ana vetou uma atividade, votou, Caio votou por script, deu match

## Fase 11: Convites

- [x] Convite por link com token aleatório (`room_invites`): expira com a sala, tem limite de usos, o mesmo link serve a todos e quem já está na sala volta sem gastar uso
- [x] QR Code do convite na sala de espera (`react-native-qrcode-svg`)
- [x] Página `/convite/[token]` que roda no app e no navegador: prévia da sala sem login, nome e "Entrar e votar" com sessão anônima
- [x] Voto pelo navegador sem instalar o app (Expo web), com a mesma sala, tempo real e resultado
- [x] Imagem do resultado com a marca para compartilhar (`react-native-view-shot` + `expo-sharing`) na roleta, comida, salas e Passa o celular; no navegador, compartilha o texto
- [x] Limite de entradas por convite por aparelho por hora
- [x] Teste de integração do convite (prévia anônima, entrada, reuso, sala cheia, token inválido, sigilo)
- [x] Conferido: Ana criou a sala no emulador, Bia entrou e votou pelo navegador, o resultado chegou aos dois; imagem compartilhada pelo menu do Android
- [ ] Publicar a versão web num domínio e definir `EXPO_PUBLIC_WEB_URL` (ver `docs/RELEASE_CHECKLIST.md`)

## Fase 12: Batalha

- [x] Batalha de opções local: comida, filme, atividade ou uma roleta própria, com 4 ou 8 opções
- [x] Chaveamento com sorteio; com quantidade ímpar, uma opção sorteada passa direto de fase; sempre n-1 duelos
- [x] Fases nomeadas (quartas, semifinal, grande final), progresso, retomada após fechar o app
- [x] Vencedor no histórico e na memória de preferências, com imagem compartilhável
- [x] Conferido no emulador: duelos e vencedor
- [ ] Batalha entre amigos (todos votam em cada duelo): entra com Amigos (Fase 14)

## Fase 13: O Que Fazer?

- [x] Quarta ferramenta na tela inicial (layout `InicioV2` do canvas, com atalhos para Match, Batalha e Surpresa)
- [x] Filtros de companhia, tempo, lugar e clima (filtro por humor)
- [x] Sugestão por contexto: prefere atividades que combinam com a hora do dia
- [x] Sorteio com antirrepetição e memória de preferências; "Vamos nessa" e "Sugerir outra" alimentam a memória
- [x] Página da atividade, "Decidir a dois" (Match de atividades), atividades no histórico com filtro próprio
- [x] Conferido no emulador

## Fase 16 (parte): Modo Surpresa

- [x] Tempo disponível, companhia e o que vale (cozinhar, sair, assistir, jogar)
- [x] Sugere receitas, filmes ou atividades que cabem no tempo, preferindo o que a pessoa nunca decidiu
- [x] Conferido no emulador

## Fase 14: Amigos, grupos e dupla

- [x] Aba Amigos na barra inferior (Favoritos foi para o Perfil, como no canvas)
- [x] Nome de usuário único; busca exata que respeita quem não quer ser achado e bloqueios
- [x] Pedido de amizade aceito pelos dois lados, pedido duplicado, recusa, pedido cruzado vira aceite, limite de 30 pedidos por dia
- [x] Convite de amizade por link e QR Code (7 dias) e lista "Decidiram com você"
- [x] Presença (online, ocupado em votação, offline e "visto por último") com um sinal por minuto, sem histórico; quem esconde a presença aparece offline e não vê os outros
- [x] Privacidade: presença, quem pode convidar (amigos, só online, ninguém), quem pode achar, avisos; bloqueio que desfaz amizade, some da busca e impede pedidos e convites; lista de bloqueados
- [x] Convites diretos para Batalha, Match, Ranking e Roleta ao vivo sobre comida, filme ou atividade, com expiração de 10 minutos e caixa de entrada em tempo real
- [x] Batalha entre amigos: todos votam em cada duelo, vence a mais votada, empate vai a sorteio, tudo no servidor
- [x] Ranking coletivo (Fase 16): contagem de Borda no servidor
- [x] Roleta ao vivo: o servidor sorteia o resultado e o deslocamento; todos os aparelhos animam até o mesmo setor
- [x] Grupos permanentes (Premium, conferido no servidor): criar com amigos, decidir com o grupo, sair, apagar
- [x] Dupla fixa: pedido, aceite dos dois lados, favoritos compartilhados (RLS), favoritos em comum, decidir agora e desfazer
- [x] 11 testes de integração da parte social e dos novos modos
- [x] Conferido no emulador: conta, nome de usuário, pedido em tempo real, Bia online, convite para Batalha, três duelos votados pelas duas, vencedor igual nos dois lados
- [ ] Notificação push dos convites: precisa de development build, projeto no EAS e credenciais do FCM; hoje o aviso é no app, em tempo real

## Fase 17: Do resultado à ação

- [x] Lista de compras de uma receita ou da semana: junta o mesmo ingrediente, soma quantidades da mesma unidade, separa o que já tem (ingredientes informados, despensa e itens marcados) e envia pelo WhatsApp
- [x] Modo cozinha: passo a passo em letra grande, tela sempre ligada (`expo-keep-awake`), timer achado no texto do passo, que conta pelo horário de término (certo após segundo plano) e avisa por notificação local
- [x] Cardápio da semana: 7 jantares sem repetir (relaxa com catálogo pequeno, nunca dois dias seguidos iguais), trocar um dia, lista única de compras, sincronizado com a conta (`meal_plans`)
- [x] Fazer em casa ou pedir: receita ou busca no mapa do celular; sem parceiros, nada patrocinado
- [x] Conferido no emulador: cardápio → lista de 30 itens; Modo cozinha com timer contando
- [ ] Links de delivery e streaming com comissão: dependem de parcerias (seção 18 do plano)

## Fase 18: Retorno

- [x] Lembretes com consentimento e desligamento por tipo: jantar (dias e horário escolhidos), cardápio da semana (domingo 11:30), "Deu certo?" no dia seguinte a uma decisão e retrospectiva no dia 1; tocar na notificação abre a tela certa
- [x] Retrospectiva do mês: total de decisões, categoria campeã, item que mais saiu e decisões em grupo, com imagem para compartilhar
- [x] Conquistas leves, sem sequência diária obrigatória, salvas na conta (`user_achievements`)
- [x] Conferido no emulador: lembrete semanal agendado no Android para o próximo domingo, 11:30; retrospectiva vazia correta
- [ ] Widgets do Android: avaliado. Exigem código nativo (por exemplo `react-native-android-widget` com config plugin) e development build; não rodam no Expo Go. Fica para depois da beta, junto com o development build da Fase 7

# DecideAí: plano mestre

> **Menos indecisão. Mais diversão.**
> App em português brasileiro para decidir o que comer, assistir e fazer, sozinho ou com outras pessoas.
> Android primeiro, com arquitetura compatível com iOS.

| | |
|---|---|
| **Estado atual** | Fase 1 implementada: projeto Expo SDK 58, navegação, tema e tela inicial. Conferida no emulador Android. |
| **Design** | [Canvas DecideAí — Telas](https://claude.ai/artifact/6wmYMEaGpwAxT4oAxMszw1), com 92 pranchas |
| **Próximo passo** | Fase 2: Roleta |
| **Última revisão** | 2026-11-09 |

## Sumário

1. [Direção do produto](#1-direção-do-produto)
2. [Decisões a confirmar](#2-decisões-a-confirmar)
3. [Stack](#3-stack)
4. [Design system](#4-design-system)
5. [Módulos da v1](#5-módulos-da-v1)
6. [Modo social](#6-modo-social)
7. [Contas e persistência](#7-contas-e-persistência)
8. [Monetização](#8-monetização)
9. [Evolução depois da v1](#9-evolução-depois-da-v1)
10. [Banco de dados](#10-banco-de-dados)
11. [Estrutura do projeto](#11-estrutura-do-projeto)
12. [Segurança e privacidade](#12-segurança-e-privacidade)
13. [Testes e qualidade](#13-testes-e-qualidade)
14. [Fases de execução](#14-fases-de-execução)
15. [Regras de implementação](#15-regras-de-implementação)
16. [Documentação obrigatória](#16-documentação-obrigatória)
17. [Critérios de conclusão da beta](#17-critérios-de-conclusão-da-beta)
18. [Riscos e configurações externas](#18-riscos-e-configurações-externas)
19. [Estado do canvas](#19-estado-do-canvas)

## 1. Direção do produto

### Público

- Casais que não conseguem decidir o que assistir ou comer.
- Amigos que precisam escolher atividades em grupo.
- Pessoas que querem descobrir receitas e filmes.
- Quem gosta de sorteios e roletas personalizadas.

### Proposta

A v1 reúne três ferramentas integradas, com visual consistente: **O Que Comer?**, **Qual Filme?** e **Roleta DecideAí**. A decisão precisa sair em poucos segundos, sem cadastro obrigatório.

### Diferencial de longo prazo

O DecideAí deixa de ser só uma roleta e passa a ajudar duas ou mais pessoas a chegar a uma decisão em comum. O usuário volta porque decidir com outras pessoas fica mais rápido e divertido.

A combinação que cria esse diferencial é **Match de decisões + Convites por link + Memória de preferências**. Ela vem antes de abrir muitas categorias.

Quase toda a inteligência prevista funciona com regras e filtros, sem depender de IA paga.

## 2. Decisões a confirmar

Pontos em que o material tem lacunas ou divergências. A coluna "Assumido" vale até haver outra decisão.

| # | Decisão | Assumido neste plano |
|---|---|---|
| 1 | A tabela de prioridades põe Batalha e O Que Fazer? antes de Match e Convites, mas o texto recomenda Match, Convites e Preferências primeiro. | Segue o texto: Preferências → Match → Convites → Batalha → O Que Fazer? |
| 2 | Tudo marcado como "Próxima versão" entra antes ou depois da beta? | Depois da beta das fases 1 a 8. A base de dados da v1 já fica preparada (seção 10). |
| 3 | Voto pelo navegador exige um cliente web e um domínio. O plano original era só Android. | Página web pequena e dedicada ao voto, na Fase 11. Domínio ainda não escolhido. |
| 4 | O Que Fazer? é grátis ou Premium? O plano grátis cita "três categorias principais". | Grátis com catálogo reduzido, e Premium com filtros avançados. |
| 5 | Limites do plano grátis não têm número definido. | Exemplos do canvas: 3 roletas, 20 favoritos, 10 itens de histórico, salas de 4 pessoas, expiração em 30 minutos. |
| 6 | Modo Surpresa, Ranking coletivo, filtros por humor, sugestões por contexto e resultados compartilháveis não têm posição na ordem de prioridades. | Resultados compartilháveis na Fase 11; os demais na Fase 16. |
| 7 | Premium Dupla é viável nas regras das lojas? | Precisa de validação antes de qualquer implementação (seção 8). |
| 8 | Amigos são grátis ou Premium? | Grátis, porque trazem novos usuários. Grupos permanentes seguem Premium. |
| 9 | Em que fase entram os amigos? | Fase 14, depois de Convites e Batalha, pois dependem de ambos. |
| 10 | Passa o celular entra já na v1? | Sim, na Fase 4, porque não depende de conta nem backend. |
| 11 | Links de delivery e streaming terão afiliados? | Só com parceria e licença confirmadas, e sempre identificados como patrocinados. |

## 3. Stack

- React Native com Expo.
- TypeScript em modo strict.
- Expo Router.
- Zustand para estado local.
- TanStack Query para dados remotos.
- Supabase para autenticação, PostgreSQL e Realtime.
- AsyncStorage para preferências locais.
- Expo Notifications.
- RevenueCat para assinaturas.
- React Native Reanimated e Gesture Handler.
- React Hook Form e Zod para formulários.
- Jest e React Native Testing Library para testes.

Antes de instalar qualquer biblioteca, verificar a compatibilidade com a versão atual do Expo. Preferir dependências estáveis e bem mantidas, e não instalar o que não for necessário.

**Arquitetura:** monólito modular no app e Supabase como backend, com Edge Functions para o que precisa ser autoritativo. Sem microsserviços.

## 4. Design system

Moderno, minimalista, divertido e premium. As definições visuais estão no canvas.

| Token | Claro | Escuro |
|---|---|---|
| Fundo | `#F8F6FF` | `#110B20` |
| Superfície | `#EDE8FD` | `#1F1736` |
| Texto | `#1B1036` | `#F4F0FF` |
| Texto de apoio | `#574C74` | `#BBB1D6` |
| Roxo principal | `#5A2BE0` | `#9478FF` |
| Azul | `#2159DB` | `#74A1FF` |
| Lilás | `#B9A2FF` | `#B9A2FF` |
| Perigo | `#B4233F` | `#FF8FA5` |

- **Tipografia:** Bricolage Grotesque nos títulos (48, 36, 26, 20) e Figtree no texto (16 e 14).
- **Forma:** raios de 16, 24 e 32 e pílula; espaços de 4, 8, 12, 20 e 24.
- **Sombra:** só no que flutua, como modal e folha inferior.
- **Logo:** roda roxa com setor lilás e três traços sobre o "í". O original está em `assets/brand/logo-original.webp`.
- **Marca nas telas:** o ponteiro da roleta cai sobre o cartão de cada decisão.

Cores, espaçamentos, tipografia, raios e sombras ficam centralizados em design tokens.

### Requisitos de UX

- Acesso às três ferramentas pela tela inicial.
- Ações principais a poucos toques.
- Nenhum cadastro obrigatório para funções individuais.
- Feedback visual durante sorteios.
- Estados de carregamento, erro e vazio.
- Suporte a diferentes tamanhos de tela.
- Acessibilidade, alvos de toque de 44 px ou mais e respeito à redução de movimento.
- Persistência das preferências do usuário.

### Componentes reutilizáveis

`AppButton`, `AppCard`, `AppModal`, `AppHeader`, `AppInput`, `AppBadge`, `AppBottomSheet`, `EmptyState`, `LoadingState`, `PremiumBadge`, `FilterChip`, `DecisionResultCard`.

## 5. Módulos da v1

### 5.1 O Que Comer?

**Sorteio rápido** nas categorias: comida caseira, fast-food, lanches, massas, comida japonesa, sobremesas, opções vegetarianas e Surpreenda-me.

**Tenho estes ingredientes:** o usuário informa o que tem e o app consulta um catálogo estruturado. Cada receita contém nome, imagem quando licenciada, ingredientes, quantidades, modo de preparo, tempo estimado, dificuldade, porções, categorias e restrições alimentares. No MVP o catálogo é local, com receitas completas e sem depender de IA.

**Filtros:** tempo de preparo, tipo de refeição, ingredientes disponíveis, ingredientes a evitar e preferências alimentares.

**Favoritos:** salvar pratos e receitas.

**Decisão em grupo:** dois ou mais participantes votam, o sistema identifica as opções mais votadas e os participantes escolhem resolver empates por rodada final ou sorteio.

### 5.2 Qual Filme?

**Descoberta** com título, capa, sinopse, gênero, ano e, quando disponíveis, duração, classificação indicativa e avaliação.

**Filtros:** filme ou série, gênero, duração, ano, classificação indicativa e plataforma de streaming quando os dados forem licenciados e disponíveis.

**Votação:** cartões de arrastar, com direita para quero assistir e esquerda para não quero. Botões de não quero, talvez e quero ficam sempre disponíveis para acessibilidade. O mesmo componente `SwipeDeck` serve aos votos em salas, no Match e no navegador. Em movimento reduzido, o cartão troca sem animação.

**Match entre pessoas:** criar sala, votar individualmente e identificar os títulos aprovados por todos. Sem correspondência, oferecer nova rodada com outros títulos ou flexibilização de filtros.

**Catálogo:** interface `MovieCatalogProvider`, desacoplada da interface visual.

- Verificar licenças comerciais, limites, atribuições e regras de armazenamento antes de integrar APIs de terceiros.
- Nunca presumir que uma API gratuita para desenvolvimento permite monetização.
- Oferecer um provedor demonstrativo com dados próprios ou licenciados.
- Não usar capas protegidas sem autorização.

### 5.3 Roleta DecideAí

- Criar, duplicar e salvar roletas.
- Adicionar, editar e excluir opções.
- Girar, exibir e compartilhar o resultado.
- Consultar o histórico.

**Animação:** giro suave, desaceleração progressiva, feedback tátil opcional, opção de som e respeito à redução de movimento. A opção sorteada precisa corresponder ao setor exibido, usando seleção aleatória apropriada e testável.

**Modelos prontos:** O que comer?, O que assistir?, Onde sair?, O que jogar?, Qual atividade fazer?, Quem começa? e Roleta em branco. Também é possível salvar modelos personalizados.

## 6. Modo social

### Fluxo

1. O usuário cria uma sala.
2. Seleciona o tipo de decisão.
3. Recebe um código e um link.
4. Compartilha com amigos.
5. Os participantes entram.
6. Todos votam.
7. O sistema calcula o resultado.
8. O resultado aparece para todos ao mesmo tempo.

### Requisitos

- Entrada de convidados sem cadastro, quando possível.
- Identificador temporário de participante.
- Código de sala difícil de adivinhar.
- Controle de acesso.
- Proteção contra votos duplicados.
- Sincronização em tempo real e reconexão após perda de internet.
- Encerramento e expiração de salas.
- Tratamento de participantes que abandonam a votação.
- Limites de participantes configuráveis.
- Proteção contra abuso e excesso de requisições.
- Resultado calculado de forma autoritativa no backend, sem confiar só no cliente.

## 7. Contas e persistência

O uso anônimo das ferramentas individuais é permitido. O login é opcional, para sincronizar e recuperar dados, com Supabase Auth.

- Cadastro, login, recuperação de conta e logout.
- Exclusão de conta e gerenciamento de perfil.
- Sincronização de favoritos e roletas.
- Histórico de decisões.
- Row Level Security nos dados privados.
- Nenhuma chave administrativa no aplicativo.
- Migração dos dados locais para a conta autenticada, sem duplicações.

## 8. Monetização

Evitar cobrar apenas por roletas ilimitadas: isso dificilmente convence alguém a pagar todo mês. O valor pago vem de preferências, grupos e decisão a dois.

| | Gratuito | Premium | Premium Dupla |
|---|---|---|---|
| **Preço de teste** | R$ 0 | R$ 9,90/mês ou R$ 69,90/ano | R$ 14,90/mês |
| **Categorias** | Três categorias principais | Todas | Todas |
| **Roletas** | Básicas, com limite salvo | Ilimitadas e personalização | Igual ao Premium |
| **Favoritos** | Limitados | Ilimitados | Ilimitados e compartilhados |
| **Salas** | Temporárias | Avançadas | Avançadas |
| **Match** | Básico | Completo | Completo |
| **Grupos permanentes** | Não | Sim | Sim |
| **Preferências inteligentes** | Não | Sim | Conjuntas |
| **Filtros** | Básicos | Avançados e preferências salvas | Avançados e preferências salvas |
| **Histórico** | Recente | Completo | Completo e compartilhado |
| **Anúncios** | Se implementados no futuro | Sem anúncios | Sem anúncios |

Os preços são sugestões para testes. Ficam configuráveis e são exibidos conforme os produtos retornados pela loja, nunca fixados no código da tela de compra.

### Integração com RevenueCat

- Paywall, compra mensal e compra anual.
- Restauração de compras e consulta de assinatura ativa.
- Tratamento de cancelamento, expiração e falhas.
- Sincronização segura do entitlement Premium.

### Regras

- Nunca liberar Premium permanentemente por uma variável local.
- Validar direitos com o serviço de assinaturas e o backend quando necessário.
- Usar ambiente de testes; nenhuma cobrança real durante o desenvolvimento.
- Ao expirar a assinatura, o app continua funcionando no plano grátis.

### Premium Dupla

Compartilhar uma assinatura precisa respeitar as regras das lojas e exige controle de acesso próprio. Antes de implementar, validar:

- como liberar o benefício para a segunda conta sem violar as políticas de Google Play e App Store;
- o que acontece quando a dupla se desfaz ou quando quem paga cancela;
- como impedir que a mesma assinatura seja vinculada em cadeia a várias contas.

## 9. Evolução depois da v1

### 9.1 Novos modos de decisão

**Match de decisões (alta prioridade).** Duas pessoas votam separadamente em comidas, filmes ou atividades. O app encontra opções que agradam às duas, sem revelar antecipadamente os votos individuais. Generaliza o match de filmes da v1 para qualquer tipo de item.

**Modo Surpresa.** O usuário informa quanto tempo tem, se está sozinho ou acompanhado e suas preferências, e o app sugere algo inesperado. Exemplo: "Você tem 40 minutos? Que tal preparar uma sobremesa diferente?"

**Batalha de opções.** Em vez de uma roleta, o usuário escolhe entre duas alternativas por rodada, e as vencedoras avançam até sobrar uma. Exemplo: pizza contra hambúrguer, sushi contra lasanha, depois a grande final. Precisa de regra para quantidades ímpares de opções.

**Ranking coletivo.** Cada participante ordena suas opções favoritas e o app combina as preferências para achar a escolha mais bem aceita. Serve para filmes, restaurantes, jogos e passeios. O método de combinação sugerido é a contagem de Borda, determinística e testável.

### 9.2 Funcionalidades inteligentes

Implementadas com regras e filtros.

| Funcionalidade | Como funciona | Prioridade |
|---|---|---|
| Memória de preferências | Aprende quais comidas, filmes e atividades o usuário costuma aceitar | Alta |
| Evitar repetições | Não sugere a mesma opção várias vezes seguidas | Alta |
| Decisão por tempo | Sugere filmes curtos ou receitas rápidas | Alta |
| Filtros por humor | Escolher entre relaxar, rir, se aventurar ou descansar | Média |
| Sugestões por contexto | Recomenda atividades conforme horário e preferências informadas | Média |

### 9.3 Novas categorias

| Categoria | Descrição | Quando |
|---|---|---|
| **O Que Fazer?** | Atividades para casais, amigos ou momentos sozinho | Quarta categoria, a primeira a lançar, pois aproveita o mesmo motor de recomendações e votações |
| **O Que Jogar?** | Sortear jogos da biblioteca ou encontrar um jogo em comum | Depois |
| **Onde Ir?** | Descobrir lugares e votar com amigos em um passeio | Depois; depende de dados de lugares licenciados |
| **O Que Conversar?** | Perguntas e assuntos para casais e grupos | Depois |

### 9.4 Crescimento orgânico

**Convite por link ou QR Code.** Um usuário cria uma decisão e compartilha pelo WhatsApp. A outra pessoa vota pelo navegador, sem instalar o app.

**Dupla fixa.** Casais ou amigos conectam as contas e mantêm preferências, favoritos e histórico compartilhados.

**Resultados compartilháveis.** Imagens bonitas com o resultado, como "Hoje a escolha foi sushi!" ou "Nosso filme da noite é...".

**Grupos permanentes.** Grupos como "Casal", "Família" ou "Amigos", sem precisar convidar as mesmas pessoas toda vez.

**Amigos.** Área própria na barra inferior, com Grupos dentro dela. Exige conta.

- Adicionar por nome de usuário, link, QR Code ou entre quem já decidiu com você; o pedido precisa ser aceito.
- Lista separada em online agora, ocupado e offline, com "visto por último".
- Convidar um ou mais amigos para Batalha, Match, Ranking ou Roleta ao vivo, sobre comida, filme ou atividade.
- Convite com expiração curta, aviso no app e notificação push.
- Na Batalha entre amigos, todos votam em cada duelo; vence a opção mais votada e o empate no duelo vai a sorteio.
- Privacidade: esconder o status online, definir quem pode convidar e encontrar, além de bloquear pessoas.

### 9.5 Priorização

Estimativas relativas para orientar o desenvolvimento, não métricas de usuários.

| Ordem deste plano | Funcionalidade | Etapa | Impacto | Esforço |
|---|---|---|---|---|
| 1 | Preferências e antirrepetição | Próxima versão | 5/5 | 2/5 |
| 2 | Match entre duas pessoas | Próxima versão | 5/5 | 3/5 |
| 3 | Convites por link | Próxima versão | 5/5 | 3/5 |
| 4 | Batalha de opções | Próxima versão | 4/5 | 2/5 |
| 5 | O Que Fazer? | Expansão | 4/5 | 2/5 |
| 6 | Grupos permanentes | Expansão | 4/5 | 3/5 |
| 7 | Premium Dupla | Monetização | 4/5 | 4/5 |

### 9.6 Antes e depois da decisão

| Funcionalidade | Como funciona | Fase |
|---|---|---|
| **Passa o celular** | Pessoas votam no mesmo aparelho, uma de cada vez, com tela de troca. Sem conta e sem internet. | 4 |
| **Deu certo?** | Depois da decisão, pergunta se foi boa: gostamos, mais ou menos ou não fizemos. Alimenta a Memória de preferências. | 9 |
| **Veto** | Cada pessoa tem um número configurável de vetos para eliminar uma opção da rodada. | 10 |
| **Roleta ao vivo** | Todos os convidados veem o mesmo giro e o mesmo resultado, sorteado no backend. | 14 |
| **Lista de compras** | Gerada com o que falta da receita, com envio pelo WhatsApp. | 17 |
| **Modo cozinha** | Passo a passo em tela cheia, com timer e tela sempre ligada. | 17 |
| **Cardápio da semana** | Sorteia sete jantares sem repetir e gera uma lista única de compras. | 17 |
| **Onde pedir ou assistir** | Links para delivery e streaming, ao lado da opção de fazer em casa. | 17 |
| **Lembretes** | Notificações em dias e horários escolhidos pelo usuário. | 18 |
| **Retrospectiva do mês** | Resumo das decisões do mês em imagem compartilhável. | 18 |
| **Widgets do Android** | Sortear, girar, ver a última decisão e chamar amigos da tela inicial do celular. | 18 |
| **Conquistas** | Marcos leves, sem sequência diária obrigatória. | 18 |
| **Modo festa** | Resultado em TV ou notebook, com convidados votando pelo celular. | 19 |
| **Pacotes temáticos** | Listas prontas e temas de roleta no Premium. | 19 |

## 10. Banco de dados

### Tabelas da v1

`profiles`, `user_preferences`, `favorite_foods`, `favorite_movies`, `recipes`, `custom_wheels`, `wheel_options`, `decision_history`, `rooms`, `room_participants`, `room_options`, `room_votes`, `room_results`.

Tabelas auxiliares só quando justificadas. Definir chaves primárias, relacionamentos, índices, restrições de integridade, políticas RLS, timestamps e migrações versionadas. Evitar dados redundantes de catálogos externos. A tabela de perfis não pode ser a única fonte de verdade para assinaturas.

### Preparação na v1

Para não reescrever as salas depois, `rooms` já nasce com tipo de item (`food`, `movie`, `activity`, `custom`) e modo de decisão (`vote`, `match`, `ranking`, `battle`).

### Acréscimos previstos

| Fase | Mudança | Finalidade |
|---|---|---|
| 9 | `preference_signals` | Aceites e recusas por item, por usuário |
| 9 | Uso de `decision_history` | Janela de antirrepetição, sem tabela nova |
| 10 | Regra RLS em `room_votes` | Voto só legível pelo autor até o resultado sair |
| 11 | `room_invites` | Token de convite com expiração e limite de uso |
| 13 | `activities` | Catálogo do O Que Fazer? |
| 14 | `groups`, `group_members`, `pair_links` | Grupos permanentes e dupla fixa, com vínculo aceito pelos dois lados |
| 14 | `username` em `profiles`, `friendships`, `user_blocks`, `friend_invites` | Nome de usuário único, amizades aceitas, bloqueios e convites com expiração |
| 14 | Supabase Realtime Presence | Status online sem tabela nova e sem gravar histórico de presença |
| 9 | `decision_feedback` | Resposta do "Deu certo?" |
| 10 | `room_vetoes` | Vetos por participante, com limite validado no backend |
| 17 | `meal_plans`, `meal_plan_items` | Cardápio da semana sincronizado |
| 18 | `user_achievements` | Conquistas obtidas |
| 19 | `theme_packs`, `theme_pack_items` | Pacotes temáticos |
| 15 | `shared_entitlements` | Direito Premium concedido à segunda conta da dupla |
| 16 | `room_rankings` | Ordem de preferência de cada participante |

## 11. Estrutura do projeto

```text
src/
  app/
  components/
    ui/
    food/
    movies/
    wheel/
    social/
    premium/
  features/
    food/
    movies/
    wheel/
    rooms/
    auth/
    subscriptions/
    preferences/      # Fase 9
    battle/           # Fase 12
    activities/       # Fase 13
    groups/           # Fase 14
    friends/          # Fase 14
  hooks/
  services/
  stores/
  repositories/
  providers/
  theme/
  types/
  utils/
  validation/
tests/
supabase/
  migrations/
  functions/
assets/
docs/
```

Lógica de negócio, acesso a dados e componentes visuais ficam separados. Evitar arquivos gigantes e componentes com responsabilidades excessivas.

## 12. Segurança e privacidade

- Validação de entrada e autorização por usuário.
- RLS no banco.
- Limites de requisição e proteção contra abuso em salas.
- Gerenciamento seguro de credenciais; nenhum segredo em variáveis públicas do Expo.
- Exclusão de dados pessoais.
- Erros sem expor informações sensíveis.
- Política de privacidade e consentimentos necessários.
- Adequação à LGPD e aos requisitos das lojas.

### Pontos novos com a evolução

- **Memória de preferências:** é tratamento de dados de comportamento. Precisa de explicação clara, opção de desligar e de apagar.
- **Dupla e grupos:** o compartilhamento exige aceite dos dois lados e desfazer o vínculo precisa ser simples, com regra definida para os dados em comum.
- **Votação pela web:** convidados sem conta exigem token temporário e limitação por sala, com proteção contra votos automatizados.
- **Votos secretos:** garantidos no banco, não só escondidos na interface.
- **Amigos e presença:** status online visível só para amigos, e desligável. Bloqueio impede pedidos, convites e busca. Pedidos e convites têm limite de envio para conter assédio e spam. Exclusão de conta remove amizades e convites.
- **Lembretes:** só com consentimento, em horários escolhidos e com desligamento por tipo.
- **Links patrocinados:** sempre identificados na tela e com divulgação de comissão.
- **Passa o celular:** votos de cada pessoa escondidos até o fim, mesmo no mesmo aparelho.

### Imagens e APIs de terceiros

As fotos do canvas vêm do Pexels e servem para o protótipo, com créditos registrados no próprio canvas. Se o app usar a API do Pexels, a chave fica no backend, e os termos de atribuição precisam ser verificados antes do lançamento.

## 13. Testes e qualidade

### v1

- Sorteio da roleta e correspondência entre resultado e animação.
- Filtros de comidas e de filmes.
- Votação em grupo, empates e votos duplicados.
- Expiração de salas e reentrada em salas.
- Persistência local.
- Login e logout.
- Controle de acesso Premium e restauração de compras.
- Testes de integração nos fluxos críticos.

### Evolução

- Antirrepetição, incluindo catálogo pequeno em que repetir é inevitável.
- Sigilo dos votos: nenhum cliente lê o voto alheio antes do resultado.
- Chaveamento da Batalha com quantidades pares e ímpares.
- Combinação do Ranking coletivo e seus empates.
- Convite expirado, reutilizado e voto pela web sem conta.
- Vínculo e desvínculo de dupla.
- Pedido de amizade duplicado, recusado e entre pessoas bloqueadas.
- Presença: usuário oculto não aparece online e estranhos não veem status.
- Convite expirado, aceito depois do início e enviado a quem bloqueou.
- Batalha entre amigos: empate no duelo e participante que sai no meio.
- Passa o celular: troca de pessoa, retomada após fechar o app e sigilo dos votos.
- Veto: limite por pessoa e todas as opções vetadas.
- Roleta ao vivo: mesmo resultado em todos os aparelhos.
- Cardápio sem repetição e soma correta de ingredientes na lista de compras.
- Timer do Modo cozinha com o app em segundo plano.
- Lembretes respeitando dias, horários e desligamento.
- Premium Dupla: concessão, cancelamento e expiração.

Validar TypeScript, lint e testes automatizados, e testar em dispositivos Android reais quando disponíveis. Não afirmar que algo foi testado se o ambiente não permitir executar o teste.

## 14. Fases de execução

### Versão beta

| Fase | Conteúdo | Entregável | Estado |
|---|---|---|---|
| **1. Fundação** | Projeto Expo, TypeScript, navegação, design system, tema claro e escuro, tela inicial e componentes | App navegável com as três seções | Implementada |
| **2. Roleta** | Criação, edição, persistência, sorteio, animação e resultado | Roleta funcional offline | Não iniciada |
| **3. Comidas** | Catálogo, receitas, ingredientes, filtros, sorteios e favoritos | Decisão alimentar sem backend obrigatório | Não iniciada |
| **4. Filmes** | Catálogo, filtros, descoberta, votos, favoritos e Passa o celular | Experiência individual com provedor substituível | Não iniciada |
| **5. Backend e salas** | Supabase, migrações, políticas, salas, participantes, votos e resultados | Decisões em grupo sincronizadas | Não iniciada |
| **6. Contas** | Autenticação opcional, perfil e sincronização | Recuperar dados em outro dispositivo | Não iniciada |
| **7. Premium** | RevenueCat, paywall, assinaturas e controle de recursos | Compras de teste e restauração em development build | Não iniciada |
| **8. Lançamento** | Acessibilidade, desempenho, segurança, privacidade, falhas, testes e EAS | Build Android de teste e checklist | Não iniciada |

A Fase 8 também prepara nome e identificador do app, ícones e splash, descrições da loja, capturas de tela, política de privacidade, configuração de assinaturas e checklist de publicação.

### Evolução

| Fase | Conteúdo | Entregável |
|---|---|---|
| **9. Preferências** | Memória de preferências, antirrepetição, decisão por tempo e Deu certo? | Sugestões melhoram com o uso e não se repetem |
| **10. Match de decisões** | Match a dois para comida, filme e atividade, com votos secretos e veto | Duas pessoas chegam a uma opção em comum |
| **11. Convites** | Link, QR Code, voto pelo navegador e imagem de resultado compartilhável | Convidado vota sem instalar o app |
| **12. Batalha** | Modo de eliminação entre pares | Decisão por rodadas até a final |
| **13. O Que Fazer?** | Quarta categoria, sobre o mesmo motor | Atividades com sorteio, filtros e votação |
| **14. Amigos e grupos** | Amigos, presença online, convites diretos, Batalha entre amigos, Roleta ao vivo, grupos permanentes e dupla fixa | Chamar quem está online e decidir sem reconvidar as mesmas pessoas |
| **15. Premium Dupla** | Plano para duas contas, depois de validar as regras das lojas | Compra e compartilhamento em ambiente de testes |
| **16. Expansão** | Modo Surpresa, Ranking coletivo, humor, contexto e demais categorias | Definido conforme o uso real |
| **17. Do resultado à ação** | Lista de compras, Modo cozinha, Cardápio da semana e Onde pedir ou assistir | A decisão vira algo concreto |
| **18. Retorno** | Lembretes, Retrospectiva, Widgets e Conquistas | Motivos para voltar ao app |
| **19. Festa e pacotes** | Modo festa e Pacotes temáticos | Uso em eventos e mais valor no Premium |

### Ao final de cada fase, apresentar

- Funcionalidades implementadas.
- Arquivos criados ou modificados.
- Testes executados e resultados.
- Problemas encontrados.
- Pendências externas.
- Próxima fase.

### Antes da Fase 1

Analisar o ambiente e apresentar, de forma resumida: arquitetura escolhida, dependências principais, estrutura de diretórios, sequência de implementação, riscos técnicos e configurações externas necessárias. Depois, criar o projeto e implementar a Fase 1.

## 15. Regras de implementação

1. Antes de programar, inspecionar o repositório e o ambiente.
2. Se o projeto estiver vazio, criar a estrutura inicial.
3. Consultar documentação atual quando necessário.
4. Priorizar a simplicidade do MVP.
5. Não introduzir microsserviços sem necessidade.
6. Não implementar IA paga como dependência obrigatória.
7. Não criar interfaces sem funcionalidades reais.
8. Não simular pagamentos como se fossem compras reais.
9. Não inventar resultados de testes.
10. Não utilizar recursos de terceiros sem verificar licenças.
11. Manter a documentação atualizada.
12. Fazer commits organizados por fase quando o repositório Git estiver configurado.
13. Nunca expor credenciais em commits.
14. Não publicar na loja nem fazer deploy de produção sem autorização explícita.
15. Se faltar uma credencial externa, implementar a interface, o adaptador e um modo de desenvolvimento claramente identificado, documentando a configuração pendente.
16. Continuar as fases de forma autônoma quando os requisitos estiverem claros e o ambiente permitir.
17. Se uma decisão exigir custo, credencial, mudança destrutiva ou autorização externa, solicitar confirmação.
18. Trabalhar por fases: implementar, executar os testes e corrigir os problemas antes de avançar.
19. Não declarar funcionalidades concluídas sem verificar seu funcionamento, mantendo o projeto compilável em cada etapa.

## 16. Documentação obrigatória

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT_PLAN.md`
- `docs/DATABASE.md`
- `docs/FEATURES.md`
- `docs/MONETIZATION.md`
- `docs/TESTING.md`
- `docs/RELEASE_CHECKLIST.md`
- `.env.example`

Manter um checklist de implementação atualizado.

## 17. Critérios de conclusão da beta

- [ ] As três ferramentas funcionam.
- [ ] O modo individual funciona sem cadastro.
- [ ] As salas compartilhadas funcionam em dispositivos distintos.
- [ ] As preferências são persistidas.
- [ ] Os recursos Premium estão corretamente protegidos.
- [ ] As compras de teste funcionam.
- [ ] Os fluxos críticos têm testes.
- [ ] O app não apresenta erros bloqueantes conhecidos.
- [ ] A documentação está atualizada.
- [ ] Um build Android instalável foi gerado e validado, quando o ambiente permitir.

## 18. Riscos e configurações externas

### Riscos técnicos

| Risco | Tratamento |
|---|---|
| Resultado da roleta divergir da animação | Sortear primeiro, derivar o ângulo do resultado e cobrir com teste |
| Sincronização de salas com conexões instáveis | Backend autoritativo, reconexão e testes de reentrada |
| Licenciamento do catálogo de filmes | Provedor demonstrativo até haver licença comercial confirmada |
| RevenueCat não roda no Expo Go | Usar development build na Fase 7 |
| Premium Dupla esbarrar em regras das lojas | Validar antes de construir |
| Abuso na votação pública pela web | Tokens, limites por sala e por origem |
| Catálogos pequenos limitarem preferências e antirrepetição | Relaxar a regra quando faltarem opções, em vez de não sugerir nada |
| Widgets exigirem código nativo fora do fluxo padrão do Expo | Avaliar plugin e development build antes da Fase 18 |
| Parcerias de delivery e streaming não saírem | Manter a opção de fazer em casa; links são opcionais |

### Configurações necessárias

| Serviço | Necessário para | Fase |
|---|---|---|
| Projeto Supabase | Banco, autenticação e tempo real | 5 |
| Conta Google Play Console | Assinaturas e publicação | 7 e 8 |
| Conta Apple Developer | Quando for lançar no iOS | Depois |
| RevenueCat | Assinaturas | 7 |
| Conta Expo e EAS | Builds | 7 e 8 |
| Provedor de filmes licenciado | Catálogo real | Antes do lançamento comercial |
| Domínio e hospedagem web | Links de convite, voto pelo navegador e Modo festa | 11 e 19 |
| Parceiros de delivery e streaming | Links e comissões | 17 |

## 19. Estado do canvas

São 92 pranchas: 40 da v1, incluindo o componente de arrastar e a logo, e 52 da evolução. O código-fonte do canvas fica em `design/canvas/`. Os títulos de filmes, as receitas, as pessoas e os limites do plano grátis são amostras.

| Área | Pranchas |
|---|---|
| **v1** | Início, Roleta, O Que Comer?, Qual Filme?, Salas, Conta e Premium, Estados e Design system |
| **Match e Ranking** | Novo match a dois, voto secreto, resultado, ordenar e resultado do ranking |
| **Convites** | QR Code, voto no navegador, imagem compartilhável e erros do voto web (convite expirado, já votou, sala cheia) |
| **Batalha** | Rodada, grande final e vencedora |
| **O Que Fazer? e Surpresa** | Início com quatro categorias, filtros e sugestão de atividade, Modo Surpresa e sua sugestão |
| **Dupla e grupos** | Conectar dupla, dupla fixa, grupos, detalhe do grupo e memória de preferências |
| **Modo escuro da evolução** | Início com quatro categorias, voto secreto, Batalha e O Que Fazer? |
| **Amigos** | Lista com quem está online, adicionar, convidar, convite enviado e recebido, privacidade, estado vazio e versão escura |
| **Decidir junto** | Passa o celular (configurar, votar, trocar), Veto e Deu certo? |
| **Do resultado à ação** | Lista de compras, Modo cozinha, Cardápio da semana e Onde pedir |
| **Motivos para voltar** | Lembretes, Retrospectiva, Widgets e Conquistas |
| **Festa e Premium** | Roleta ao vivo, Pacotes temáticos e Modo festa na TV |

O Paywall, na linha Conta e Premium, já mostra os três planos. O Premium Dupla só entra na Fase 15; até lá, o app exibe dois planos. O QR Code é ilustrativo. A prancha da Roleta e a da Batalha têm lógica funcional no modo Play.

### Telas ainda não desenhadas

- Categorias O Que Jogar?, Onde Ir? e O Que Conversar?.
- Modo escuro das demais telas de evolução.

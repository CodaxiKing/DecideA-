# Banco de dados

Supabase (PostgreSQL). As migrações ficam em `supabase/migrations/` e são aplicadas em ordem.

## Rodar localmente

Precisa do Docker. O projeto usa as portas 544xx para não colidir com outros projetos Supabase locais.

```bash
npm run db:start
```

```bash
npx supabase status
```

Copie `API_URL` e `ANON_KEY` para o `.env.local` (veja `.env.example`). No emulador Android, troque `127.0.0.1` pelo IP da máquina na rede.

```bash
npm run test:integration
```

Roda os testes de integração das salas com dois clientes anônimos, como se fossem dois aparelhos. Precisa das variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os valores de `npx supabase status`.

## Salas (Fase 5) — `20261110000000_rooms.sql`

| Tabela | Conteúdo |
|---|---|
| `rooms` | Sala: código de 6 caracteres, anfitrião, tipo de item (`food`, `movie`, `activity`, `custom`), modo de decisão (`vote`, `match`, `ranking`, `battle`), estado (`lobby`, `voting`, `closed`), limite de pessoas e expiração |
| `room_participants` | Quem está na sala, com nome de exibição, quando terminou de votar e quando saiu |
| `room_options` | Opções votadas, com a referência ao item do catálogo e o título |
| `room_votes` | Um voto por pessoa por opção (chave primária `option_id, user_id`) |
| `room_results` | Resultado calculado no servidor: vencedor, ranking, unanimidade e empatados |

### Regras

- **Identidade:** cada aparelho entra com sessão anônima do Supabase Auth (convidado sem cadastro). Quem tiver conta usa a própria.
- **Leitura (RLS):** só membros da sala leem sala, participantes, opções e resultado. Votos são secretos: cada pessoa só lê os próprios.
- **Escrita:** o cliente não grava direto em nenhuma tabela. Tudo passa pelas funções `create_room`, `join_room`, `start_voting`, `cast_vote`, `finish_voting`, `leave_room` e `close_room`, que validam estado, expiração, limite de pessoas e autoria.
- **Resultado autoritativo:** `_compute_room_result` calcula no banco (quero = 2, talvez = 1, menos "não" desempata, empate no topo vira sorteio) quando todos que ficaram terminam, quando o último pendente sai, ou quando o anfitrião encerra.
- **Código:** 6 caracteres de um alfabeto de 32 símbolos sem I, O, 0 e 1, gerado com `gen_random_bytes` (cerca de 1 bilhão de combinações).
- **Abuso:** no máximo 10 salas por pessoa por hora; reentrada não ocupa outra vaga; voto repetido substitui o anterior.
- **Expiração:** 30 minutos no plano grátis. Sala expirada recusa entrada, início e votos.
- **Tempo real:** `rooms`, `room_participants` e `room_results` estão na publicação `supabase_realtime`. O app também confere o estado a cada 15 s e ao reconectar.

## Contas (Fase 6) — `20261111000000_accounts.sql`

| Tabela | Conteúdo |
|---|---|
| `profiles` | Perfil criado junto com a conta (gatilho em `auth.users`): nome de exibição |
| `user_preferences` | Tema e vibração |
| `favorite_foods`, `favorite_movies` | Favoritos, chave `(user_id, item)`: reenviar não duplica |
| `custom_wheels`, `wheel_options` | Roletas e opções, com ids gerados no aparelho (uuid) |
| `decision_history` | Histórico de decisões, id gerado no aparelho |

### Regras

- **RLS:** cada pessoa lê e escreve só o que é dela, e só contas com e-mail (`is_registered_user`). Convidados anônimos das salas não sincronizam.
- **Convidado vira conta:** criar conta numa sessão anônima mantém o mesmo usuário, então a participação nas salas continua. O app renova o token logo depois, porque o antigo ainda diz "anônimo".
- **Sincronização sem duplicar:** o app apaga o que foi excluído, traz o que está na conta, junta com o aparelho (vence a roleta editada por último) e envia o resultado. Tudo por id.
- **Exclusão de conta:** `delete_account()` apaga o usuário em `auth.users` e, em cascata, perfil, preferências, favoritos, roletas, histórico e participação e votos em salas.
- **Senha:** mínimo de 8 caracteres. Recuperação por link de e-mail (`decideai://conta/nova-senha?code=`), com troca do código por sessão (PKCE).

## Preferências (Fase 9) — `20261113000000_preferences.sql`

- `preference_signals`: aceites e recusas por item, por pessoa (RLS só da própria conta).
- `decision_history.feedback`: resposta do "Deu certo?".

## Match e veto (Fase 10) — `20261114000000_match_vetoes.sql`

- `rooms.vetoes_per_person` e `room_vetoes` (um veto por pessoa por opção, limite validado em `cast_veto`, leitura só do próprio veto).
- `create_room` aceita `p_decision_mode` (`vote` ou `match`) e `p_vetoes`. Match é sempre a dois.
- `_compute_room_result`: opções vetadas nunca vencem; no Match, só vence o que todos marcaram "quero".
- `room_results.vetoed_option_ids` mostra o que caiu.

## Convites (Fase 11) — `20261115000000_invites.sql`

- `room_invites`: token de 32 caracteres, expira com a sala, `max_uses` de 2× o limite de pessoas; leitura só por membros.
- `create_invite` reaproveita o convite válido; `invite_preview` funciona sem login e não mostra dados de ninguém; `join_room_by_invite` valida token, expiração, usos e limite de 20 entradas por hora por aparelho (`invite_joins`).

## Social (Fase 14) — `20261116000000_social.sql`

- `profiles` ganha `username` (único), privacidade (`show_presence`, `invite_policy`, `discoverable`, `notify_invites`), `status` e `last_seen_at` (só o último sinal).
- `friendships` (um vínculo por par), `user_blocks`, `friend_invites`, `room_friend_invites`, `groups`, `group_members`, `pair_links` (uma dupla por pessoa), `push_tokens`.
- Leitura de perfis alheios só por funções (`my_friends`, `find_user`, `decided_with_me`…) que aplicam privacidade e bloqueio. Escrita só por funções.
- A dupla aceita lê os favoritos e sinais de preferência da outra pessoa (políticas `pair_partner`).
- Grupos exigem Premium no servidor (`has_premium`).

## Modos de sala (Fases 14 e 16) — `20261117000000_room_modes.sql`

- `rooms.decision_mode` aceita `battle`, `ranking` e `wheel`.
- Batalha: `rooms.battle_state` e `room_duel_votes`; `vote_duel` resolve o duelo quando todos votaram (empate: sorteio) e avança as rodadas.
- Ranking: `room_rankings` e `submit_ranking`; resultado por contagem de Borda.
- Roleta ao vivo: `spin_live_wheel` (só o anfitrião) grava vencedor e `room_results.spin_offset`.

## Próximas tabelas

As demais estão listadas na [seção 10 do plano](../plan.md#10-banco-de-dados).

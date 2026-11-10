-- Fases 14 e 16: Batalha entre amigos, Ranking coletivo e Roleta ao vivo.
-- Tudo decidido no servidor; os aparelhos só mostram.

alter table public.rooms
  add column battle_state jsonb;

alter table public.rooms drop constraint rooms_decision_mode_check;
alter table public.rooms add constraint rooms_decision_mode_check
  check (decision_mode in ('vote', 'match', 'ranking', 'battle', 'wheel'));

alter table public.room_results
  add column spin_offset double precision;

-- Ordem de cada participante no Ranking coletivo.
create table public.room_rankings (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  option_ids uuid[] not null,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.room_rankings enable row level security;
create policy "cada um lê a própria ordem" on public.room_rankings
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.room_rankings from anon, authenticated;

-- Votos de cada duelo da Batalha em grupo.
create table public.room_duel_votes (
  room_id uuid not null references public.rooms (id) on delete cascade,
  duel_no int not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  option_id uuid not null references public.room_options (id) on delete cascade,
  primary key (room_id, duel_no, user_id)
);
alter table public.room_duel_votes enable row level security;
create policy "cada um lê o próprio voto no duelo" on public.room_duel_votes
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.room_duel_votes from anon, authenticated;

-- create_room aceita os novos modos.
drop function if exists public.create_room(text, text, jsonb, int, text, int);
create or replace function public.create_room(
  p_item_type text,
  p_display_name text,
  p_options jsonb,
  p_max_participants int default 4,
  p_decision_mode text default 'vote',
  p_vetoes int default 0
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  v_code text;
  v_count int;
  v_premium boolean;
  v_cap int;
  opt jsonb;
  pos int := 0;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  select count(*) into v_count from public.rooms
  where host_id = auth.uid() and created_at > now() - interval '1 hour';
  if v_count >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) not between 2 and 20 then
    raise exception 'invalid_options' using errcode = '22023';
  end if;
  if p_decision_mode not in ('vote', 'match', 'battle', 'ranking', 'wheel') then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;

  v_premium := public.has_premium(auth.uid());
  v_cap := case when p_decision_mode = 'match' then 2 when v_premium then 12 else 4 end;

  loop
    v_code := public._room_code();
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;

  insert into public.rooms (code, host_id, item_type, decision_mode, max_participants, vetoes_per_person, expires_at)
  values (
    v_code, auth.uid(), p_item_type, p_decision_mode,
    least(greatest(coalesce(p_max_participants, 4), 2), v_cap),
    case when p_decision_mode in ('vote', 'match') then least(greatest(coalesce(p_vetoes, 0), 0), 3) else 0 end,
    now() + case when v_premium then interval '2 hours' else interval '30 minutes' end
  )
  returning * into r;

  insert into public.room_participants (room_id, user_id, display_name)
  values (r.id, auth.uid(), btrim(p_display_name));

  for opt in select * from jsonb_array_elements(p_options) loop
    insert into public.room_options (room_id, ref_id, title, position)
    values (r.id, opt ->> 'ref_id', opt ->> 'title', pos);
    pos := pos + 1;
  end loop;

  return r;
end;
$$;

-- ---------------------------------------------------------------------------
-- Batalha em grupo: todos votam em cada duelo; vence a mais votada; empate vai a sorteio.
-- battle_state = {"current": [...], "next": [...], "index": 0, "duel": 1, "round": 1}
-- ---------------------------------------------------------------------------
create or replace function public._battle_bye(p_list uuid[], p_next uuid[])
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
begin
  if coalesce(array_length(p_list, 1), 0) % 2 = 1 then
    return jsonb_build_object('current', to_jsonb(p_list[1:array_length(p_list, 1) - 1]),
                              'next', to_jsonb(p_next || p_list[array_length(p_list, 1)]));
  end if;
  return jsonb_build_object('current', to_jsonb(p_list), 'next', to_jsonb(p_next));
end;
$$;

create or replace function public._battle_init(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ids uuid[];
  b jsonb;
begin
  select array_agg(id order by random()) into ids from public.room_options where room_id = p_room_id;
  b := public._battle_bye(ids, '{}');
  update public.rooms
  set battle_state = b || jsonb_build_object('index', 0, 'duel', 1, 'round', 1, 'total', array_length(ids, 1))
  where id = p_room_id;
end;
$$;

create or replace function public._battle_try_resolve(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb;
  cur uuid[];
  nxt uuid[];
  idx int;
  duel int;
  a uuid;
  b uuid;
  voters int;
  votes int;
  va int;
  vb int;
  winner uuid;
  nb jsonb;
begin
  select battle_state into st from public.rooms where id = p_room_id and status = 'voting' and decision_mode = 'battle' for update;
  if st is null then
    return;
  end if;
  cur := array(select jsonb_array_elements_text(st -> 'current')::uuid);
  nxt := array(select jsonb_array_elements_text(st -> 'next')::uuid);
  idx := (st ->> 'index')::int;
  duel := (st ->> 'duel')::int;
  a := cur[idx + 1];
  b := cur[idx + 2];

  select count(*) into voters from public.room_participants where room_id = p_room_id and left_at is null;
  select count(*), count(*) filter (where option_id = a), count(*) filter (where option_id = b)
  into votes, va, vb
  from public.room_duel_votes v
  where v.room_id = p_room_id and v.duel_no = duel
    and v.user_id in (select user_id from public.room_participants where room_id = p_room_id and left_at is null);
  if votes < voters or voters = 0 then
    return;
  end if;

  winner := case when va > vb then a when vb > va then b when random() < 0.5 then a else b end;
  nxt := nxt || winner;
  idx := idx + 2;

  if idx < coalesce(array_length(cur, 1), 0) then
    update public.rooms set battle_state = st || jsonb_build_object('next', to_jsonb(nxt), 'index', idx, 'duel', duel + 1)
    where id = p_room_id;
    return;
  end if;

  if array_length(nxt, 1) = 1 then
    insert into public.room_results (room_id, winner_option_id, ranking, unanimous, tied_option_ids, voters)
    values (p_room_id, winner, '[]'::jsonb, false, '{}', voters);
    update public.rooms
    set status = 'closed', closed_at = now(), battle_state = st || jsonb_build_object('next', '[]'::jsonb, 'index', idx, 'duel', duel + 1)
    where id = p_room_id;
    return;
  end if;

  nb := public._battle_bye(nxt, '{}');
  update public.rooms
  set battle_state = st || nb || jsonb_build_object('index', 0, 'duel', duel + 1, 'round', (st ->> 'round')::int + 1)
  where id = p_room_id;
end;
$$;

create or replace function public.vote_duel(p_room_id uuid, p_duel_no int, p_option_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
  st jsonb := r.battle_state;
  idx int;
begin
  if r.status <> 'voting' or r.decision_mode <> 'battle' or st is null then
    raise exception 'not_voting' using errcode = 'P0001';
  end if;
  if (st ->> 'duel')::int <> p_duel_no then
    return; -- duelo já resolvido: o voto atrasado é ignorado
  end if;
  idx := (st ->> 'index')::int;
  if p_option_id::text not in ((st -> 'current') ->> idx, (st -> 'current') ->> (idx + 1)) then
    raise exception 'invalid_option' using errcode = '22023';
  end if;
  insert into public.room_duel_votes (room_id, duel_no, user_id, option_id)
  values (p_room_id, p_duel_no, auth.uid(), p_option_id)
  on conflict (room_id, duel_no, user_id) do update set option_id = excluded.option_id;
  perform public._battle_try_resolve(p_room_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Ranking coletivo (contagem de Borda): 1º lugar vale n-1 pontos, o último 0.
-- ---------------------------------------------------------------------------
create or replace function public.submit_ranking(p_room_id uuid, p_option_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
  n int;
begin
  if r.status <> 'voting' or r.decision_mode <> 'ranking' then
    raise exception 'not_voting' using errcode = 'P0001';
  end if;
  select count(*) into n from public.room_options where room_id = p_room_id;
  -- Precisa ser uma ordem de todas as opções, sem repetir.
  if array_length(p_option_ids, 1) <> n
     or (select count(distinct x) from unnest(p_option_ids) x) <> n
     or exists (select 1 from unnest(p_option_ids) x where x not in (select id from public.room_options where room_id = p_room_id)) then
    raise exception 'invalid_options' using errcode = '22023';
  end if;
  insert into public.room_rankings (room_id, user_id, option_ids) values (p_room_id, auth.uid(), p_option_ids)
  on conflict (room_id, user_id) do update set option_ids = excluded.option_ids, created_at = now();
  update public.room_participants set finished_at = coalesce(finished_at, now()) where room_id = p_room_id and user_id = auth.uid();
  perform public._maybe_finish_room(p_room_id);
end;
$$;

create or replace function public._compute_ranking_result(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
  voters int;
  best int;
  tied uuid[];
  winner uuid;
  ranking jsonb;
begin
  if exists (select 1 from public.room_results where room_id = p_room_id) then
    return;
  end if;
  select count(*) into n from public.room_options where room_id = p_room_id;
  select count(*) into voters from public.room_rankings rr
  where rr.room_id = p_room_id
    and rr.user_id in (select user_id from public.room_participants where room_id = p_room_id and left_at is null);

  drop table if exists _borda;
  create temporary table _borda on commit drop as
  select o.id, o.title, o.position,
         coalesce(sum(n - x.ord), 0)::int as score
  from public.room_options o
  left join (
    select rr.user_id, u.opt, u.ord
    from public.room_rankings rr, unnest(rr.option_ids) with ordinality as u(opt, ord)
    where rr.room_id = p_room_id
      and rr.user_id in (select user_id from public.room_participants where room_id = p_room_id and left_at is null)
  ) x on x.opt = o.id
  where o.room_id = p_room_id
  group by o.id, o.title, o.position;

  select max(score) into best from _borda;
  if coalesce(best, 0) = 0 then
    winner := null;
    tied := '{}';
  else
    select array_agg(id) into tied from _borda where score = best;
    winner := tied[1 + floor(random() * array_length(tied, 1))::int];
    if array_length(tied, 1) = 1 then
      tied := '{}';
    end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('option_id', id, 'title', title, 'score', score, 'yes', 0, 'maybe', 0, 'no', 0)
           order by (id = winner) desc, score desc, position), '[]'::jsonb)
  into ranking from _borda;

  insert into public.room_results (room_id, winner_option_id, ranking, unanimous, tied_option_ids, voters)
  values (p_room_id, winner, ranking, false, coalesce(tied, '{}'), voters);
  update public.rooms set status = 'closed', closed_at = now() where id = p_room_id;
end;
$$;

-- _maybe_finish_room passa a saber de cada modo.
create or replace function public._maybe_finish_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
begin
  select decision_mode into v_mode from public.rooms where id = p_room_id and status = 'voting';
  if v_mode is null then
    return;
  end if;
  if v_mode = 'battle' then
    perform public._battle_try_resolve(p_room_id);
    return;
  end if;
  if v_mode = 'wheel' then
    return;
  end if;
  if not exists (
       select 1 from public.room_participants
       where room_id = p_room_id and left_at is null and finished_at is null
     )
     and exists (select 1 from public.room_participants where room_id = p_room_id and left_at is null)
  then
    if v_mode = 'ranking' then
      perform public._compute_ranking_result(p_room_id);
    else
      perform public._compute_room_result(p_room_id);
    end if;
  end if;
end;
$$;

-- Começar a votação prepara a Batalha.
create or replace function public.start_voting(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
begin
  if r.host_id <> auth.uid() then
    raise exception 'host_only' using errcode = '42501';
  end if;
  if r.expires_at < now() then
    raise exception 'room_expired' using errcode = 'P0001';
  end if;
  if r.status <> 'lobby' then
    return;
  end if;
  if r.decision_mode = 'wheel' then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;
  update public.rooms set status = 'voting' where id = p_room_id;
  if r.decision_mode = 'battle' then
    perform public._battle_init(p_room_id);
  end if;
end;
$$;

-- Encerrar pelo anfitrião respeita o modo.
create or replace function public.close_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
begin
  if r.host_id <> auth.uid() then
    raise exception 'host_only' using errcode = '42501';
  end if;
  if r.status = 'closed' then
    return;
  end if;
  if r.decision_mode = 'ranking' then
    perform public._compute_ranking_result(p_room_id);
  elsif r.decision_mode in ('vote', 'match') then
    perform public._compute_room_result(p_room_id);
  else
    update public.rooms set status = 'closed', closed_at = now() where id = p_room_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roleta ao vivo: o servidor sorteia; todos animam até o mesmo resultado.
-- ---------------------------------------------------------------------------
create or replace function public.spin_live_wheel(p_room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
  winner uuid;
  voters int;
begin
  if r.decision_mode <> 'wheel' then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;
  if r.host_id <> auth.uid() then
    raise exception 'host_only' using errcode = '42501';
  end if;
  if r.status = 'closed' then
    return (select winner_option_id from public.room_results where room_id = p_room_id);
  end if;
  select id into winner from public.room_options where room_id = p_room_id order by random() limit 1;
  select count(*) into voters from public.room_participants where room_id = p_room_id and left_at is null;
  insert into public.room_results (room_id, winner_option_id, ranking, unanimous, tied_option_ids, voters, spin_offset)
  values (p_room_id, winner, '[]'::jsonb, false, '{}', voters, 0.15 + random() * 0.7);
  update public.rooms set status = 'closed', closed_at = now() where id = p_room_id;
  return winner;
end;
$$;

revoke execute on function public._battle_bye(uuid[], uuid[]), public._battle_init(uuid), public._battle_try_resolve(uuid),
  public._compute_ranking_result(uuid) from public, anon, authenticated;
revoke execute on function public.create_room(text, text, jsonb, int, text, int), public.vote_duel(uuid, int, uuid),
  public.submit_ranking(uuid, uuid[]), public.spin_live_wheel(uuid) from public, anon;
grant execute on function public.create_room(text, text, jsonb, int, text, int), public.vote_duel(uuid, int, uuid),
  public.submit_ranking(uuid, uuid[]), public.spin_live_wheel(uuid) to authenticated;

-- Fase 5: salas de decisão em grupo.
-- Toda escrita passa por funções (security definer) que validam e decidem no servidor.
-- O cliente só lê, e só o que é da sala em que está.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('food', 'movie', 'activity', 'custom')),
  decision_mode text not null default 'vote' check (decision_mode in ('vote', 'match', 'ranking', 'battle')),
  status text not null default 'lobby' check (status in ('lobby', 'voting', 'closed')),
  max_participants int not null default 4 check (max_participants between 2 and 20),
  expires_at timestamptz not null default now() + interval '30 minutes',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index rooms_host_created_idx on public.rooms (host_id, created_at desc);
create index rooms_expires_idx on public.rooms (expires_at);

create table public.room_participants (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 20),
  joined_at timestamptz not null default now(),
  finished_at timestamptz,
  left_at timestamptz,
  primary key (room_id, user_id)
);
create index room_participants_user_idx on public.room_participants (user_id);

create table public.room_options (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  ref_id text not null check (char_length(ref_id) between 1 and 80),
  title text not null check (char_length(title) between 1 and 120),
  position int not null,
  unique (room_id, ref_id),
  unique (room_id, position)
);

create table public.room_votes (
  room_id uuid not null references public.rooms (id) on delete cascade,
  option_id uuid not null references public.room_options (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote text not null check (vote in ('yes', 'maybe', 'no')),
  created_at timestamptz not null default now(),
  -- Um voto por pessoa por opção: impede voto duplicado.
  primary key (option_id, user_id)
);
create index room_votes_room_idx on public.room_votes (room_id);

create table public.room_results (
  room_id uuid primary key references public.rooms (id) on delete cascade,
  winner_option_id uuid references public.room_options (id) on delete set null,
  ranking jsonb not null,
  unanimous boolean not null default false,
  tied_option_ids uuid[] not null default '{}',
  voters int not null,
  computed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Acesso (RLS): só leitura, e só para quem participa da sala
-- ---------------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.room_options enable row level security;
alter table public.room_votes enable row level security;
alter table public.room_results enable row level security;

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_participants
    where room_id = p_room_id and user_id = auth.uid()
  );
$$;

create policy "membros leem a sala" on public.rooms
  for select to authenticated using (public.is_room_member(id));
create policy "membros leem participantes" on public.room_participants
  for select to authenticated using (public.is_room_member(room_id));
create policy "membros leem opções" on public.room_options
  for select to authenticated using (public.is_room_member(room_id));
-- Votos são secretos: cada pessoa só lê os próprios. O placar sai em room_results.
create policy "cada um lê o próprio voto" on public.room_votes
  for select to authenticated using (user_id = auth.uid());
create policy "membros leem o resultado" on public.room_results
  for select to authenticated using (public.is_room_member(room_id));

revoke insert, update, delete on public.rooms, public.room_participants, public.room_options,
  public.room_votes, public.room_results from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Funções internas
-- ---------------------------------------------------------------------------

create or replace function public._room_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sem I, O, 0 e 1
  bytes bytea := extensions.gen_random_bytes(6);
  out text := '';
begin
  for i in 0..5 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return out;
end;
$$;

create or replace function public._require_room(p_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  select * into r from public.rooms where id = p_room_id;
  if not found or not public.is_room_member(p_room_id) then
    raise exception 'room_not_found' using errcode = 'P0002';
  end if;
  return r;
end;
$$;

-- Calcula o resultado (mesma regra do app: quero = 2, talvez = 1; desempate por menos "não";
-- empate no topo vira sorteio) e fecha a sala.
create or replace function public._compute_room_result(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_voters int;
  v_best record;
  v_tied uuid[];
  v_winner uuid;
  v_ranking jsonb;
  v_unanimous boolean;
begin
  if exists (select 1 from public.room_results where room_id = p_room_id) then
    return;
  end if;

  select count(*) into v_voters
  from public.room_participants
  where room_id = p_room_id and left_at is null;

  drop table if exists _tally;
  create temporary table _tally on commit drop as
  select o.id, o.title, o.position,
         count(v.*) filter (where v.vote = 'yes') as yes,
         count(v.*) filter (where v.vote = 'maybe') as maybe,
         -- voto que faltou conta como "não"
         v_voters - count(v.*) filter (where v.vote in ('yes', 'maybe')) as no
  from public.room_options o
  left join public.room_votes v
    on v.option_id = o.id
   and v.user_id in (select user_id from public.room_participants where room_id = p_room_id and left_at is null)
  where o.room_id = p_room_id
  group by o.id, o.title, o.position;

  select yes * 2 + maybe as score, no into v_best
  from _tally order by yes * 2 + maybe desc, no asc limit 1;

  if v_best is null or v_best.score = 0 then
    v_winner := null;
    v_tied := '{}';
  else
    select array_agg(id) into v_tied
    from _tally where yes * 2 + maybe = v_best.score and no = v_best.no;
    v_winner := v_tied[1 + floor(random() * array_length(v_tied, 1))::int];
    if array_length(v_tied, 1) = 1 then
      v_tied := '{}';
    end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'option_id', id, 'title', title, 'yes', yes, 'maybe', maybe, 'no', no, 'score', yes * 2 + maybe)
         order by (id = v_winner) desc, yes * 2 + maybe desc, no asc, position asc), '[]'::jsonb)
  into v_ranking from _tally;

  select coalesce((select yes = v_voters and v_voters > 0 from _tally where id = v_winner), false)
  into v_unanimous;

  insert into public.room_results (room_id, winner_option_id, ranking, unanimous, tied_option_ids, voters)
  values (p_room_id, v_winner, v_ranking, v_unanimous, coalesce(v_tied, '{}'), v_voters);

  update public.rooms set status = 'closed', closed_at = now() where id = p_room_id;
end;
$$;

-- Fecha a sala quando todo mundo que ficou já terminou de votar.
create or replace function public._maybe_finish_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.rooms where id = p_room_id and status = 'voting')
     and not exists (
       select 1 from public.room_participants
       where room_id = p_room_id and left_at is null and finished_at is null
     )
     and exists (select 1 from public.room_participants where room_id = p_room_id and left_at is null)
  then
    perform public._compute_room_result(p_room_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- API (chamada pelo app via RPC)
-- ---------------------------------------------------------------------------

create or replace function public.create_room(
  p_item_type text,
  p_display_name text,
  p_options jsonb,
  p_max_participants int default 4
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
  opt jsonb;
  pos int := 0;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  -- Limite contra abuso: no máximo 10 salas por pessoa por hora.
  select count(*) into v_count from public.rooms
  where host_id = auth.uid() and created_at > now() - interval '1 hour';
  if v_count >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) not between 2 and 20 then
    raise exception 'invalid_options' using errcode = '22023';
  end if;

  loop
    v_code := public._room_code();
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;

  insert into public.rooms (code, host_id, item_type, max_participants)
  values (v_code, auth.uid(), p_item_type, least(greatest(coalesce(p_max_participants, 4), 2), 20))
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

create or replace function public.join_room(p_code text, p_display_name text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  select * into r from public.rooms where code = upper(btrim(p_code));
  if not found then
    raise exception 'room_not_found' using errcode = 'P0002';
  end if;

  -- Reentrada: quem já está na sala volta sem ocupar outra vaga.
  if exists (select 1 from public.room_participants where room_id = r.id and user_id = auth.uid()) then
    update public.room_participants set left_at = null
    where room_id = r.id and user_id = auth.uid() and r.status <> 'closed';
    return r;
  end if;

  if r.expires_at < now() then
    raise exception 'room_expired' using errcode = 'P0001';
  end if;
  if r.status <> 'lobby' then
    raise exception 'room_started' using errcode = 'P0001';
  end if;
  select count(*) into v_count from public.room_participants where room_id = r.id and left_at is null;
  if v_count >= r.max_participants then
    raise exception 'room_full' using errcode = 'P0001';
  end if;

  insert into public.room_participants (room_id, user_id, display_name)
  values (r.id, auth.uid(), btrim(p_display_name));
  return r;
end;
$$;

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
  update public.rooms set status = 'voting' where id = p_room_id;
end;
$$;

create or replace function public.cast_vote(p_room_id uuid, p_option_id uuid, p_vote text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
begin
  if r.status <> 'voting' then
    raise exception 'not_voting' using errcode = 'P0001';
  end if;
  if r.expires_at < now() then
    raise exception 'room_expired' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.room_options where id = p_option_id and room_id = p_room_id) then
    raise exception 'invalid_option' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.room_participants
    where room_id = p_room_id and user_id = auth.uid() and (finished_at is not null or left_at is not null)
  ) then
    raise exception 'already_finished' using errcode = 'P0001';
  end if;
  insert into public.room_votes (room_id, option_id, user_id, vote)
  values (p_room_id, p_option_id, auth.uid(), p_vote)
  on conflict (option_id, user_id) do update set vote = excluded.vote, created_at = now();
end;
$$;

create or replace function public.finish_voting(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
begin
  if r.status <> 'voting' then
    return;
  end if;
  update public.room_participants set finished_at = coalesce(finished_at, now())
  where room_id = p_room_id and user_id = auth.uid();
  perform public._maybe_finish_room(p_room_id);
end;
$$;

create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
begin
  if r.status = 'closed' then
    return;
  end if;
  update public.room_participants set left_at = now()
  where room_id = p_room_id and user_id = auth.uid();
  perform public._maybe_finish_room(p_room_id);
end;
$$;

-- O anfitrião encerra a votação com quem já votou.
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
  -- Quem não terminou entra no cálculo com o que já votou (o resto conta como "não").
  perform public._compute_room_result(p_room_id);
end;
$$;

-- Funções internas não ficam expostas pela API.
revoke execute on function public._room_code(), public._require_room(uuid), public._compute_room_result(uuid),
  public._maybe_finish_room(uuid) from public, anon, authenticated;
revoke execute on function public.create_room(text, text, jsonb, int), public.join_room(text, text),
  public.start_voting(uuid), public.cast_vote(uuid, uuid, text), public.finish_voting(uuid),
  public.leave_room(uuid), public.close_room(uuid) from public, anon;
grant execute on function public.create_room(text, text, jsonb, int), public.join_room(text, text),
  public.start_voting(uuid), public.cast_vote(uuid, uuid, text), public.finish_voting(uuid),
  public.leave_room(uuid), public.close_room(uuid), public.is_room_member(uuid) to authenticated;

-- Tempo real: mudanças de sala, participantes e resultado chegam aos membros (respeitando o RLS).
alter publication supabase_realtime add table public.rooms, public.room_participants, public.room_results;

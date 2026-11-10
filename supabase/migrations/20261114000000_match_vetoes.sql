-- Fase 10: Match a dois e veto.
-- Match: só conta o que TODOS marcaram "quero". Veto: cada pessoa elimina até N opções.

alter table public.rooms
  add column vetoes_per_person int not null default 0 check (vetoes_per_person between 0 and 3);

alter table public.room_results
  add column vetoed_option_ids uuid[] not null default '{}';

create table public.room_vetoes (
  room_id uuid not null references public.rooms (id) on delete cascade,
  option_id uuid not null references public.room_options (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (option_id, user_id)
);
create index room_vetoes_room_idx on public.room_vetoes (room_id, user_id);

alter table public.room_vetoes enable row level security;
-- Vetos são secretos como os votos: cada um vê só os próprios; o resultado mostra o que caiu.
create policy "cada um lê o próprio veto" on public.room_vetoes
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.room_vetoes from anon, authenticated;

-- create_room ganha modo de decisão e vetos (mesma regra de plano da Fase 7).
drop function if exists public.create_room(text, text, jsonb, int);

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
  if p_decision_mode not in ('vote', 'match') then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;

  v_premium := public.has_premium(auth.uid());
  -- Match é sempre a dois.
  v_cap := case when p_decision_mode = 'match' then 2 when v_premium then 12 else 4 end;

  loop
    v_code := public._room_code();
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;

  insert into public.rooms (code, host_id, item_type, decision_mode, max_participants, vetoes_per_person, expires_at)
  values (
    v_code,
    auth.uid(),
    p_item_type,
    p_decision_mode,
    least(greatest(coalesce(p_max_participants, 4), 2), v_cap),
    least(greatest(coalesce(p_vetoes, 0), 0), 3),
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

create or replace function public.cast_veto(p_room_id uuid, p_option_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
  v_used int;
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
  if exists (select 1 from public.room_vetoes where option_id = p_option_id and user_id = auth.uid()) then
    return; -- vetar de novo a mesma opção não gasta outro veto
  end if;
  select count(*) into v_used from public.room_vetoes where room_id = p_room_id and user_id = auth.uid();
  if v_used >= r.vetoes_per_person then
    raise exception 'no_vetoes_left' using errcode = 'P0001';
  end if;
  insert into public.room_vetoes (room_id, option_id, user_id) values (p_room_id, p_option_id, auth.uid());
end;
$$;

-- Resultado com veto e Match.
create or replace function public._compute_room_result(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
  v_voters int;
  v_best record;
  v_tied uuid[];
  v_winner uuid;
  v_ranking jsonb;
  v_unanimous boolean;
  v_vetoed uuid[];
begin
  if exists (select 1 from public.room_results where room_id = p_room_id) then
    return;
  end if;
  select decision_mode into v_mode from public.rooms where id = p_room_id;

  select count(*) into v_voters
  from public.room_participants
  where room_id = p_room_id and left_at is null;

  select coalesce(array_agg(distinct option_id), '{}') into v_vetoed
  from public.room_vetoes
  where room_id = p_room_id
    and user_id in (select user_id from public.room_participants where room_id = p_room_id and left_at is null);

  drop table if exists _tally;
  create temporary table _tally on commit drop as
  select o.id, o.title, o.position, (o.id = any (v_vetoed)) as vetoed,
         count(v.*) filter (where v.vote = 'yes') as yes,
         count(v.*) filter (where v.vote = 'maybe') as maybe,
         v_voters - count(v.*) filter (where v.vote in ('yes', 'maybe')) as no
  from public.room_options o
  left join public.room_votes v
    on v.option_id = o.id
   and v.user_id in (select user_id from public.room_participants where room_id = p_room_id and left_at is null)
  where o.room_id = p_room_id
  group by o.id, o.title, o.position;

  if v_mode = 'match' then
    -- Match: só vale o que todo mundo quis.
    select array_agg(id order by position) into v_tied
    from _tally where not vetoed and yes = v_voters and v_voters > 0;
    if v_tied is null then
      v_winner := null;
      v_tied := '{}';
    else
      v_winner := v_tied[1 + floor(random() * array_length(v_tied, 1))::int];
      if array_length(v_tied, 1) = 1 then
        v_tied := '{}';
      end if;
    end if;
  else
    select yes * 2 + maybe as score, no into v_best
    from _tally where not vetoed order by yes * 2 + maybe desc, no asc limit 1;

    if v_best is null or v_best.score = 0 then
      v_winner := null;
      v_tied := '{}';
    else
      select array_agg(id) into v_tied
      from _tally where not vetoed and yes * 2 + maybe = v_best.score and no = v_best.no;
      v_winner := v_tied[1 + floor(random() * array_length(v_tied, 1))::int];
      if array_length(v_tied, 1) = 1 then
        v_tied := '{}';
      end if;
    end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'option_id', id, 'title', title, 'yes', yes, 'maybe', maybe, 'no', no,
           'score', yes * 2 + maybe, 'vetoed', vetoed)
         order by (id = v_winner) desc, vetoed asc, yes * 2 + maybe desc, no asc, position asc), '[]'::jsonb)
  into v_ranking from _tally;

  select coalesce((select yes = v_voters and v_voters > 0 from _tally where id = v_winner), false)
  into v_unanimous;

  insert into public.room_results (room_id, winner_option_id, ranking, unanimous, tied_option_ids, voters, vetoed_option_ids)
  values (p_room_id, v_winner, v_ranking, v_unanimous, coalesce(v_tied, '{}'), v_voters, v_vetoed);

  update public.rooms set status = 'closed', closed_at = now() where id = p_room_id;
end;
$$;

revoke execute on function public._compute_room_result(uuid) from public, anon, authenticated;
revoke execute on function public.create_room(text, text, jsonb, int, text, int), public.cast_veto(uuid, uuid) from public, anon;
grant execute on function public.create_room(text, text, jsonb, int, text, int), public.cast_veto(uuid, uuid) to authenticated;

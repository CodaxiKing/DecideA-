-- Fase 11: convites por link e QR Code, com voto pelo navegador sem instalar o app.
-- O token é longo e aleatório, expira com a sala e tem limite de usos.

create table public.room_invites (
  token text primary key check (token ~ '^[A-Za-z0-9_-]{24,64}$'),
  room_id uuid not null references public.rooms (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  max_uses int not null check (max_uses between 1 and 50),
  uses int not null default 0,
  created_at timestamptz not null default now()
);
create index room_invites_room_idx on public.room_invites (room_id);

alter table public.room_invites enable row level security;
-- Só quem está na sala vê os convites dela.
create policy "membros leem convites" on public.room_invites
  for select to authenticated using (public.is_room_member(room_id));
revoke insert, update, delete on public.room_invites from anon, authenticated;

-- Quem convidou: registro leve para limitar entradas por pessoa (anti-abuso).
create table public.invite_joins (
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index invite_joins_user_idx on public.invite_joins (user_id, joined_at desc);
alter table public.invite_joins enable row level security;
revoke all on public.invite_joins from anon, authenticated;

create or replace function public.create_invite(p_room_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
  v_token text;
  v_existing text;
begin
  if r.status = 'closed' or r.expires_at < now() then
    raise exception 'room_expired' using errcode = 'P0001';
  end if;
  -- Reaproveita o convite válido da sala, para o mesmo link servir a todos.
  select token into v_existing from public.room_invites
  where room_id = p_room_id and expires_at > now() and uses < max_uses
  order by created_at desc limit 1;
  if v_existing is not null then
    return v_existing;
  end if;
  v_token := translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/=', '-_');
  insert into public.room_invites (token, room_id, created_by, expires_at, max_uses)
  values (v_token, p_room_id, auth.uid(), r.expires_at, greatest(r.max_participants * 2, 4));
  return v_token;
end;
$$;

-- Mostra o básico da sala do convite antes de entrar (sem dados de ninguém).
create or replace function public.invite_preview(p_token text)
returns table (room_code text, item_type text, decision_mode text, status text, expires_at timestamptz, participants int, max_participants int)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
  select r.code, r.item_type, r.decision_mode, r.status, r.expires_at,
         (select count(*)::int from public.room_participants p where p.room_id = r.id and p.left_at is null),
         r.max_participants
  from public.room_invites i join public.rooms r on r.id = i.room_id
  where i.token = p_token;
end;
$$;

create or replace function public.join_room_by_invite(p_token text, p_display_name text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.room_invites;
  r public.rooms;
  v_recent int;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  select * into inv from public.room_invites where token = p_token for update;
  if not found then
    raise exception 'invite_invalid' using errcode = 'P0002';
  end if;
  if inv.expires_at < now() then
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;
  -- Quem já está na sala volta sem gastar uso do convite.
  if exists (select 1 from public.room_participants where room_id = inv.room_id and user_id = auth.uid()) then
    select * into r from public.rooms where id = inv.room_id;
    return public.join_room(r.code, p_display_name);
  end if;
  if inv.uses >= inv.max_uses then
    raise exception 'invite_used_up' using errcode = 'P0001';
  end if;
  -- Limite por aparelho: no máximo 20 entradas por convite por hora.
  select count(*) into v_recent from public.invite_joins where user_id = auth.uid() and joined_at > now() - interval '1 hour';
  if v_recent >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select * into r from public.rooms where id = inv.room_id;
  r := public.join_room(r.code, p_display_name);
  update public.room_invites set uses = uses + 1 where token = p_token;
  insert into public.invite_joins (user_id) values (auth.uid());
  return r;
end;
$$;

revoke execute on function public.create_invite(uuid), public.invite_preview(text), public.join_room_by_invite(text, text) from public;
grant execute on function public.create_invite(uuid), public.join_room_by_invite(text, text) to authenticated;
-- A prévia funciona sem login, para a página do convite mostrar o que é antes de entrar.
grant execute on function public.invite_preview(text) to anon, authenticated;

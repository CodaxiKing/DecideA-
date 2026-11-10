-- Fase 14: amigos, presença, bloqueios, convites diretos, grupos e dupla fixa.
-- Tudo exige conta (não anônima). Escrita só por funções; leitura com RLS.

-- ---------------------------------------------------------------------------
-- Perfil: usuário, privacidade e presença (só o último sinal, sem histórico)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column username text unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  add column show_presence boolean not null default true,
  add column invite_policy text not null default 'friends' check (invite_policy in ('friends', 'online_friends', 'nobody')),
  add column discoverable boolean not null default true,
  add column notify_invites boolean not null default true,
  add column status text not null default 'online' check (status in ('online', 'busy')),
  add column last_seen_at timestamptz;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  check (requester_id <> addressee_id)
);
-- Um único vínculo por par, em qualquer direção.
create unique index friendships_pair_idx on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id, status);

create table public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.friend_invites (
  token text primary key check (token ~ '^[A-Za-z0-9_-]{16,64}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.room_friend_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (room_id, to_id)
);
create index room_friend_invites_to_idx on public.room_friend_invites (to_id, status, expires_at);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 30),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

create table public.pair_links (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  partner_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  check (requester_id <> partner_id)
);
-- Cada pessoa tem no máximo uma dupla (pendente ou aceita).
create unique index pair_links_requester_idx on public.pair_links (requester_id);
create unique index pair_links_partner_idx on public.pair_links (partner_id);

create table public.push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

-- ---------------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------------
create or replace function public._require_registered()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_registered_user() then
    raise exception 'account_required' using errcode = '28000';
  end if;
  return auth.uid();
end;
$$;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and least(requester_id, addressee_id) = least(a, b)
      and greatest(requester_id, addressee_id) = greatest(a, b)
  );
$$;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.pair_partner(u uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case when requester_id = u then partner_id else requester_id end
  from public.pair_links
  where status = 'accepted' and (requester_id = u or partner_id = u)
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- RLS: leitura
-- ---------------------------------------------------------------------------
alter table public.friendships enable row level security;
alter table public.user_blocks enable row level security;
alter table public.friend_invites enable row level security;
alter table public.room_friend_invites enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.pair_links enable row level security;
alter table public.push_tokens enable row level security;

create policy "vínculos próprios" on public.friendships
  for select to authenticated using (auth.uid() in (requester_id, addressee_id));
create policy "bloqueios próprios" on public.user_blocks
  for select to authenticated using (blocker_id = auth.uid());
create policy "convites de amizade próprios" on public.friend_invites
  for select to authenticated using (user_id = auth.uid());
create policy "convites de sala recebidos ou enviados" on public.room_friend_invites
  for select to authenticated using (auth.uid() in (from_id, to_id));
-- Função auxiliar (security definer) evita recursão nas regras de group_members.
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.group_members where group_id = p_group_id and user_id = auth.uid());
$$;

create policy "grupos de que participo" on public.groups
  for select to authenticated using (owner_id = auth.uid() or public.is_group_member(id));
create policy "membros dos meus grupos" on public.group_members
  for select to authenticated using (public.is_group_member(group_id));
create policy "dupla própria" on public.pair_links
  for select to authenticated using (auth.uid() in (requester_id, partner_id));
create policy "tokens próprios" on public.push_tokens
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_registered_user());

-- A dupla aceita vê os favoritos da outra pessoa (favoritos compartilhados).
create policy "dupla lê favoritos de comida" on public.favorite_foods
  for select to authenticated using (user_id = public.pair_partner(auth.uid()));
create policy "dupla lê favoritos de filme" on public.favorite_movies
  for select to authenticated using (user_id = public.pair_partner(auth.uid()));
create policy "dupla lê sinais" on public.preference_signals
  for select to authenticated using (user_id = public.pair_partner(auth.uid()));

revoke insert, update, delete on public.friendships, public.user_blocks, public.friend_invites, public.room_friend_invites,
  public.groups, public.group_members, public.pair_links from anon, authenticated;

-- Perfis: cada um edita os próprios campos de privacidade e nome; o resto passa por funções.
-- A leitura de perfis alheios é feita pelas funções abaixo, que respeitam privacidade e bloqueio.

-- ---------------------------------------------------------------------------
-- Perfil e presença
-- ---------------------------------------------------------------------------
create or replace function public.set_username(p_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
  v text := lower(btrim(p_username));
begin
  if v !~ '^[a-z0-9_.]{3,20}$' then
    raise exception 'invalid_username' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles where username = v and id <> me) then
    raise exception 'username_taken' using errcode = 'P0001';
  end if;
  update public.profiles set username = v, updated_at = now() where id = me;
end;
$$;

create or replace function public.update_social_settings(
  p_show_presence boolean,
  p_invite_policy text,
  p_discoverable boolean,
  p_notify_invites boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
begin
  update public.profiles
  set show_presence = p_show_presence,
      invite_policy = p_invite_policy,
      discoverable = p_discoverable,
      notify_invites = p_notify_invites,
      updated_at = now()
  where id = me;
end;
$$;

-- Sinal de vida: chamado a cada minuto com o app aberto. Guarda só o último.
create or replace function public.heartbeat(p_status text default 'online')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
begin
  update public.profiles
  set last_seen_at = now(), status = case when p_status = 'busy' then 'busy' else 'online' end
  where id = me;
end;
$$;

create or replace function public.go_offline()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
begin
  update public.profiles set last_seen_at = now() - interval '5 minutes' where id = me;
end;
$$;

-- Lista de amigos com presença. Quem esconde a presença aparece offline,
-- e quem esconde a própria também não vê a dos outros.
create or replace function public.my_friends()
returns table (user_id uuid, username text, display_name text, presence text, last_seen_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
  i_show boolean;
begin
  select show_presence into i_show from public.profiles where id = me;
  return query
  select p.id, p.username, p.display_name,
         case
           when not i_show or not p.show_presence or p.last_seen_at is null then 'offline'
           when p.last_seen_at > now() - interval '2 minutes' then
             case when p.status = 'busy' or exists (
               select 1 from public.room_participants rp join public.rooms r on r.id = rp.room_id
               where rp.user_id = p.id and rp.left_at is null and r.status = 'voting' and r.expires_at > now()
             ) then 'busy' else 'online' end
           else 'offline'
         end,
         case when i_show and p.show_presence then p.last_seen_at else null end
  from public.friendships f
  join public.profiles p on p.id = case when f.requester_id = me then f.addressee_id else f.requester_id end
  where f.status = 'accepted' and me in (f.requester_id, f.addressee_id)
  order by p.display_name nulls last, p.username;
end;
$$;

-- Pedidos de amizade recebidos, com o nome de quem pediu.
create or replace function public.pending_friend_requests()
returns table (id uuid, user_id uuid, username text, display_name text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, p.id, p.username, p.display_name, f.created_at
  from public.friendships f join public.profiles p on p.id = f.requester_id
  where f.addressee_id = public._require_registered() and f.status = 'pending'
  order by f.created_at desc;
$$;

-- Busca exata por usuário (sem listar ninguém), respeitando quem não quer ser achado e bloqueios.
create or replace function public.find_user(p_username text)
returns table (user_id uuid, username text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name
  from public.profiles p
  where p.username = lower(btrim(p_username))
    and p.discoverable
    and p.id <> public._require_registered()
    and not public.is_blocked_between(p.id, auth.uid());
$$;

-- Pessoas que já decidiram com você (estiveram nas mesmas salas) e ainda não são amigas.
create or replace function public.decided_with_me()
returns table (user_id uuid, username text, display_name text, last_room_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, max(p.display_name), max(r.created_at)
  from public.room_participants mine
  join public.room_participants other on other.room_id = mine.room_id and other.user_id <> mine.user_id
  join public.rooms r on r.id = mine.room_id
  join public.profiles p on p.id = other.user_id
  where mine.user_id = public._require_registered()
    and p.username is not null
    and not public.are_friends(mine.user_id, p.id)
    and not public.is_blocked_between(mine.user_id, p.id)
  group by p.id, p.username
  order by max(r.created_at) desc
  limit 10;
$$;

-- ---------------------------------------------------------------------------
-- Amizades e bloqueios
-- ---------------------------------------------------------------------------
create or replace function public.send_friend_request(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
  existing public.friendships;
  v_recent int;
begin
  if p_user_id = me then
    raise exception 'invalid_user' using errcode = '22023';
  end if;
  if public.is_blocked_between(me, p_user_id) then
    -- Não revela o bloqueio: responde como se tivesse enviado.
    return 'sent';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id and username is not null) then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  select * into existing from public.friendships
  where least(requester_id, addressee_id) = least(me, p_user_id) and greatest(requester_id, addressee_id) = greatest(me, p_user_id);
  if found then
    if existing.status = 'accepted' then
      return 'already_friends';
    end if;
    -- A outra pessoa já tinha pedido: aceitar.
    if existing.addressee_id = me then
      update public.friendships set status = 'accepted', accepted_at = now() where id = existing.id;
      return 'accepted';
    end if;
    return 'already_sent';
  end if;
  -- Limite contra assédio e spam: 30 pedidos por dia.
  select count(*) into v_recent from public.friendships where requester_id = me and created_at > now() - interval '1 day';
  if v_recent >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.friendships (requester_id, addressee_id) values (me, p_user_id);
  return 'sent';
end;
$$;

create or replace function public.respond_friend_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
begin
  if p_accept then
    update public.friendships set status = 'accepted', accepted_at = now()
    where id = p_request_id and addressee_id = me and status = 'pending';
  else
    delete from public.friendships where id = p_request_id and addressee_id = me and status = 'pending';
  end if;
end;
$$;

create or replace function public.remove_friend(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
begin
  delete from public.friendships
  where least(requester_id, addressee_id) = least(me, p_user_id) and greatest(requester_id, addressee_id) = greatest(me, p_user_id);
  delete from public.pair_links where (requester_id = me and partner_id = p_user_id) or (requester_id = p_user_id and partner_id = me);
end;
$$;

create or replace function public.block_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
begin
  perform public.remove_friend(p_user_id);
  delete from public.room_friend_invites where (from_id = p_user_id and to_id = me) or (from_id = me and to_id = p_user_id);
  insert into public.user_blocks (blocker_id, blocked_id) values (me, p_user_id) on conflict do nothing;
end;
$$;

create or replace function public.unblock_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_blocks where blocker_id = public._require_registered() and blocked_id = p_user_id;
end;
$$;

create or replace function public.blocked_users()
returns table (user_id uuid, username text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name
  from public.user_blocks b join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = public._require_registered();
$$;

-- Convite de amizade por link ou QR (válido por 7 dias).
create or replace function public.create_friend_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
  v_token text;
begin
  select token into v_token from public.friend_invites where user_id = me and expires_at > now() + interval '1 day' order by created_at desc limit 1;
  if v_token is not null then
    return v_token;
  end if;
  v_token := translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/=', '-_');
  insert into public.friend_invites (token, user_id, expires_at) values (v_token, me, now() + interval '7 days');
  return v_token;
end;
$$;

create or replace function public.accept_friend_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
  inv public.friend_invites;
begin
  select * into inv from public.friend_invites where token = p_token;
  if not found or inv.expires_at < now() then
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;
  if inv.user_id = me then
    raise exception 'invalid_user' using errcode = '22023';
  end if;
  if public.is_blocked_between(me, inv.user_id) then
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;
  -- O link vale como aceite de quem o criou: a amizade já nasce aceita.
  insert into public.friendships (requester_id, addressee_id, status, accepted_at)
  values (inv.user_id, me, 'accepted', now())
  on conflict ((least(requester_id, addressee_id)), (greatest(requester_id, addressee_id)))
  do update set status = 'accepted', accepted_at = coalesce(public.friendships.accepted_at, now());
  return (select coalesce(display_name, username) from public.profiles where id = inv.user_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Convites diretos para salas
-- ---------------------------------------------------------------------------
create or replace function public.invite_friends_to_room(p_room_id uuid, p_user_ids uuid[])
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
  r public.rooms := public._require_room(p_room_id);
  target uuid;
  policy text;
  sent int := 0;
  online boolean;
begin
  if r.status <> 'lobby' or r.expires_at < now() then
    raise exception 'room_started' using errcode = 'P0001';
  end if;
  foreach target in array p_user_ids loop
    continue when not public.are_friends(me, target) or public.is_blocked_between(me, target);
    select invite_policy, (show_presence and last_seen_at > now() - interval '2 minutes') into policy, online
    from public.profiles where id = target;
    continue when policy = 'nobody' or (policy = 'online_friends' and not coalesce(online, false));
    insert into public.room_friend_invites (room_id, from_id, to_id, expires_at)
    values (p_room_id, me, target, least(r.expires_at, now() + interval '10 minutes'))
    on conflict (room_id, to_id) do nothing;
    sent := sent + 1;
  end loop;
  return sent;
end;
$$;

create or replace function public.my_room_invites()
returns table (id uuid, room_id uuid, from_name text, item_type text, decision_mode text, expires_at timestamptz, participants text[])
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.room_id, coalesce(p.display_name, p.username), r.item_type, r.decision_mode, i.expires_at,
         array(select rp.display_name from public.room_participants rp where rp.room_id = r.id and rp.left_at is null order by rp.joined_at)
  from public.room_friend_invites i
  join public.rooms r on r.id = i.room_id
  join public.profiles p on p.id = i.from_id
  where i.to_id = public._require_registered()
    and i.status = 'pending' and i.expires_at > now() and r.status = 'lobby'
  order by i.created_at desc;
$$;

create or replace function public.respond_room_invite(p_invite_id uuid, p_accept boolean, p_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
  inv public.room_friend_invites;
  r public.rooms;
  v_name text;
begin
  select * into inv from public.room_friend_invites where id = p_invite_id and to_id = me;
  if not found then
    raise exception 'invite_invalid' using errcode = 'P0002';
  end if;
  if not p_accept then
    update public.room_friend_invites set status = 'declined' where id = p_invite_id;
    return null;
  end if;
  if inv.expires_at < now() then
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;
  select * into r from public.rooms where id = inv.room_id;
  select coalesce(nullif(btrim(p_display_name), ''), display_name, username) into v_name from public.profiles where id = me;
  perform public.join_room(r.code, v_name);
  update public.room_friend_invites set status = 'accepted' where id = p_invite_id;
  return r.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grupos permanentes (Premium no app)
-- ---------------------------------------------------------------------------
create or replace function public.create_group(p_name text, p_member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
  g uuid;
  m uuid;
begin
  -- Grupos permanentes são do Premium (seção 8), confirmado no servidor.
  if not public.has_premium(me) then
    raise exception 'premium_required' using errcode = 'P0001';
  end if;
  if (select count(*) from public.groups where owner_id = me) >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.groups (owner_id, name) values (me, btrim(p_name)) returning id into g;
  insert into public.group_members (group_id, user_id) values (g, me);
  foreach m in array p_member_ids loop
    continue when not public.are_friends(me, m);
    insert into public.group_members (group_id, user_id) values (g, m) on conflict do nothing;
  end loop;
  return g;
end;
$$;

create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
begin
  if exists (select 1 from public.groups where id = p_group_id and owner_id = me) then
    delete from public.groups where id = p_group_id;
  else
    delete from public.group_members where group_id = p_group_id and user_id = me;
  end if;
end;
$$;

create or replace function public.my_groups()
returns table (id uuid, name text, is_owner boolean, members jsonb, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.name, g.owner_id = auth.uid(),
         (select jsonb_agg(jsonb_build_object('user_id', p.id, 'name', coalesce(p.display_name, p.username)) order by m.added_at)
          from public.group_members m join public.profiles p on p.id = m.user_id where m.group_id = g.id),
         g.created_at
  from public.groups g
  where exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = public._require_registered())
  order by g.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Dupla fixa: aceita pelos dois lados, desfeita por qualquer um
-- ---------------------------------------------------------------------------
create or replace function public.request_pair(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
begin
  if not public.are_friends(me, p_user_id) then
    raise exception 'not_friends' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.pair_links where me in (requester_id, partner_id) or p_user_id in (requester_id, partner_id)) then
    raise exception 'already_paired' using errcode = 'P0001';
  end if;
  insert into public.pair_links (requester_id, partner_id) values (me, p_user_id);
end;
$$;

create or replace function public.respond_pair(p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public._require_registered();
begin
  if p_accept then
    update public.pair_links set status = 'accepted', accepted_at = now() where partner_id = me and status = 'pending';
  else
    delete from public.pair_links where partner_id = me and status = 'pending';
  end if;
end;
$$;

create or replace function public.unpair()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.pair_links where public._require_registered() in (requester_id, partner_id);
end;
$$;

create or replace function public.my_pair()
returns table (id uuid, status text, i_requested boolean, partner_id uuid, partner_name text, accepted_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.status, l.requester_id = auth.uid(),
         p.id, coalesce(p.display_name, p.username), l.accepted_at
  from public.pair_links l
  join public.profiles p on p.id = case when l.requester_id = auth.uid() then l.partner_id else l.requester_id end
  where public._require_registered() in (l.requester_id, l.partner_id);
$$;

-- ---------------------------------------------------------------------------
-- Permissões
-- ---------------------------------------------------------------------------
revoke execute on function public._require_registered(), public.are_friends(uuid, uuid), public.is_blocked_between(uuid, uuid),
  public.pair_partner(uuid) from public, anon;
grant execute on function public.pair_partner(uuid) to authenticated;

do $$
declare f text;
begin
  foreach f in array array[
    'set_username(text)', 'update_social_settings(boolean, text, boolean, boolean)', 'heartbeat(text)', 'go_offline()',
    'my_friends()', 'pending_friend_requests()', 'find_user(text)', 'decided_with_me()', 'send_friend_request(uuid)',
    'respond_friend_request(uuid, boolean)', 'remove_friend(uuid)', 'block_user(uuid)', 'unblock_user(uuid)', 'blocked_users()',
    'create_friend_invite()', 'accept_friend_invite(text)', 'invite_friends_to_room(uuid, uuid[])', 'my_room_invites()',
    'respond_room_invite(uuid, boolean, text)', 'create_group(text, uuid[])', 'leave_group(uuid)', 'my_groups()',
    'request_pair(uuid)', 'respond_pair(boolean)', 'unpair()', 'my_pair()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- Avisos em tempo real de pedidos e convites.
alter publication supabase_realtime add table public.friendships, public.room_friend_invites, public.pair_links;

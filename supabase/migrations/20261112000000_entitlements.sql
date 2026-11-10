-- Fase 7: direito Premium confirmado no servidor.
-- Quem grava é só o webhook do RevenueCat (Edge Function com a chave de serviço).
-- O app pode ler o próprio registro, mas nunca escrever.

create table public.user_entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  entitlement text not null check (entitlement in ('premium')),
  expires_at timestamptz,
  product_id text,
  source text not null default 'revenuecat',
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement)
);

alter table public.user_entitlements enable row level security;

create policy "cada um lê o próprio direito" on public.user_entitlements
  for select to authenticated using (user_id = auth.uid());

revoke insert, update, delete on public.user_entitlements from anon, authenticated;

create or replace function public.has_premium(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_entitlements
    where user_id = p_user_id
      and entitlement = 'premium'
      and (expires_at is null or expires_at > now())
  );
$$;

revoke execute on function public.has_premium(uuid) from public, anon, authenticated;

-- Salas: o tamanho e a duração passam a depender do plano confirmado no servidor.
-- Grátis: até 4 pessoas e 30 minutos. Premium: até 12 pessoas e 2 horas.
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

  v_premium := public.has_premium(auth.uid());
  v_cap := case when v_premium then 12 else 4 end;

  loop
    v_code := public._room_code();
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;

  insert into public.rooms (code, host_id, item_type, max_participants, expires_at)
  values (
    v_code,
    auth.uid(),
    p_item_type,
    least(greatest(coalesce(p_max_participants, 4), 2), v_cap),
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

revoke execute on function public.create_room(text, text, jsonb, int) from public, anon;
grant execute on function public.create_room(text, text, jsonb, int) to authenticated;

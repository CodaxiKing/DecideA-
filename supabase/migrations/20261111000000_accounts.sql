-- Fase 6: contas e sincronização.
-- Dados privados: cada pessoa lê e escreve só o que é dela (RLS por auth.uid()).
-- Sessões anônimas (convidados das salas) não sincronizam: só contas com e-mail.

create or replace function public.is_registered_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() is not null and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  haptics boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.favorite_foods (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text not null check (char_length(recipe_id) between 1 and 80),
  added_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create table public.favorite_movies (
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id text not null check (char_length(movie_id) between 1 and 80),
  added_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

-- O id vem do aparelho (uuid), o que torna a sincronização idempotente: sem duplicar.
create table public.custom_wheels (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  last_spun_at timestamptz
);
create index custom_wheels_user_idx on public.custom_wheels (user_id, updated_at desc);

create table public.wheel_options (
  id uuid primary key,
  wheel_id uuid not null references public.custom_wheels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 24),
  position int not null check (position between 0 and 15)
);
create index wheel_options_wheel_idx on public.wheel_options (wheel_id, position);

create table public.decision_history (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('wheel', 'food', 'movie', 'activity')),
  title text not null check (char_length(title) between 1 and 120),
  source text not null check (char_length(source) between 1 and 120),
  ref_id text,
  created_at timestamptz not null
);
create index decision_history_user_idx on public.decision_history (user_id, created_at desc);

-- RLS --------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.favorite_foods enable row level security;
alter table public.favorite_movies enable row level security;
alter table public.custom_wheels enable row level security;
alter table public.wheel_options enable row level security;
alter table public.decision_history enable row level security;

create policy "perfil próprio" on public.profiles
  for all to authenticated
  using (id = auth.uid() and public.is_registered_user())
  with check (id = auth.uid() and public.is_registered_user());

create policy "preferências próprias" on public.user_preferences
  for all to authenticated
  using (user_id = auth.uid() and public.is_registered_user())
  with check (user_id = auth.uid() and public.is_registered_user());

create policy "favoritos de comida próprios" on public.favorite_foods
  for all to authenticated
  using (user_id = auth.uid() and public.is_registered_user())
  with check (user_id = auth.uid() and public.is_registered_user());

create policy "favoritos de filme próprios" on public.favorite_movies
  for all to authenticated
  using (user_id = auth.uid() and public.is_registered_user())
  with check (user_id = auth.uid() and public.is_registered_user());

create policy "roletas próprias" on public.custom_wheels
  for all to authenticated
  using (user_id = auth.uid() and public.is_registered_user())
  with check (user_id = auth.uid() and public.is_registered_user());

create policy "opções das roletas próprias" on public.wheel_options
  for all to authenticated
  using (user_id = auth.uid() and public.is_registered_user())
  with check (
    user_id = auth.uid()
    and public.is_registered_user()
    and exists (select 1 from public.custom_wheels w where w.id = wheel_id and w.user_id = auth.uid())
  );

create policy "histórico próprio" on public.decision_history
  for all to authenticated
  using (user_id = auth.uid() and public.is_registered_user())
  with check (user_id = auth.uid() and public.is_registered_user());

revoke all on public.profiles, public.user_preferences, public.favorite_foods, public.favorite_movies,
  public.custom_wheels, public.wheel_options, public.decision_history from anon;

-- Perfil criado junto com a conta -----------------------------------------------

create or replace function public._create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public._create_profile();

-- Exclusão de conta: apaga o usuário e, em cascata, todos os dados dele
-- (perfil, favoritos, roletas, histórico, participação e votos em salas).
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_account(), public._create_profile() from public, anon;
grant execute on function public.delete_account() to authenticated;
grant execute on function public.is_registered_user() to authenticated;

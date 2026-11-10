-- Fases 17 e 18: cardápio da semana sincronizado e conquistas.

create table public.meal_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  recipe_ids text[] not null check (array_length(recipe_ids, 1) <= 7),
  updated_at timestamptz not null
);
alter table public.meal_plans enable row level security;
create policy "cardápio próprio" on public.meal_plans
  for all to authenticated
  using (user_id = auth.uid() and public.is_registered_user())
  with check (user_id = auth.uid() and public.is_registered_user());
revoke all on public.meal_plans from anon;

create table public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement text not null check (char_length(achievement) between 1 and 40),
  achieved_at timestamptz not null,
  primary key (user_id, achievement)
);
alter table public.user_achievements enable row level security;
create policy "conquistas próprias" on public.user_achievements
  for all to authenticated
  using (user_id = auth.uid() and public.is_registered_user())
  with check (user_id = auth.uid() and public.is_registered_user());
revoke all on public.user_achievements from anon;

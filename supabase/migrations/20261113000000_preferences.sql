-- Fase 9: memória de preferências e "Deu certo?".

create table public.preference_signals (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('food', 'movie', 'activity')),
  item_id text not null check (char_length(item_id) between 1 and 80),
  accepted int not null default 0 check (accepted >= 0),
  rejected int not null default 0 check (rejected >= 0),
  updated_at timestamptz not null,
  primary key (user_id, kind, item_id)
);

alter table public.preference_signals enable row level security;

create policy "sinais próprios" on public.preference_signals
  for all to authenticated
  using (user_id = auth.uid() and public.is_registered_user())
  with check (user_id = auth.uid() and public.is_registered_user());

revoke all on public.preference_signals from anon;

-- Resposta do "Deu certo?" fica na própria decisão (sem tabela nova).
alter table public.decision_history
  add column feedback text check (feedback in ('liked', 'meh', 'skipped', 'dismissed'));

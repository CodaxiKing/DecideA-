-- Fase 19: Modo festa. A tela grande mostra o andamento sem revelar votos:
-- quantas pessoas estão na sala, quantas terminaram e quantas votaram no duelo atual.

create or replace function public.room_progress(p_room_id uuid)
returns table (participants int, finished int, duel_votes int)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.rooms := public._require_room(p_room_id);
begin
  return query
  select
    (select count(*)::int from public.room_participants where room_id = p_room_id and left_at is null),
    (select count(*)::int from public.room_participants where room_id = p_room_id and left_at is null and finished_at is not null),
    (select count(*)::int from public.room_duel_votes v
      where v.room_id = p_room_id and v.duel_no = coalesce((r.battle_state ->> 'duel')::int, 0));
end;
$$;

revoke execute on function public.room_progress(uuid) from public, anon;
grant execute on function public.room_progress(uuid) to authenticated;

-- Votos de duelo chegam em tempo real à tela da festa (só a contagem é lida, via função).
alter publication supabase_realtime add table public.room_duel_votes;

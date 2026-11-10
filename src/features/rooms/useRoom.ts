import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { roomsRepository } from '../../repositories/roomsRepository';
import { requireSupabase, supabase } from '../../services/supabase';

export function useRoomsRepository() {
  return useMemo(() => (supabase ? roomsRepository(supabase) : null), []);
}

export function roomsRepo() {
  return roomsRepository(requireSupabase());
}

/** Estado da sala, atualizado em tempo real. */
export function useRoomState(roomId: string | undefined) {
  const repo = useRoomsRepository();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => repo!.fetchState(roomId!),
    enabled: !!repo && !!roomId,
    // Rede de segurança caso o tempo real caia: confere de novo a cada 15 s.
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!repo || !roomId) return;
    return repo.subscribe(roomId, () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    });
  }, [repo, roomId, queryClient]);

  return query;
}

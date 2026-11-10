import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import type { Room, RoomItemType, RoomState, RoomVote } from '../features/rooms/types';

export interface InvitePreview {
  room_code: string;
  item_type: RoomItemType;
  decision_mode: 'vote' | 'match';
  status: 'lobby' | 'voting' | 'closed';
  expires_at: string;
  participants: number;
  max_participants: number;
}

/**
 * Acesso às salas. Recebe o cliente por parâmetro para servir ao app e aos
 * testes de integração (dois clientes = dois aparelhos).
 */
export function roomsRepository(client: SupabaseClient) {
  const rpc = async <T>(fn: string, args: Record<string, unknown>): Promise<T> => {
    const { data, error } = await client.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data as T;
  };

  return {
    createRoom: (input: {
      itemType: RoomItemType;
      displayName: string;
      options: { ref_id: string; title: string }[];
      maxParticipants: number;
      mode?: 'vote' | 'match' | 'battle' | 'ranking' | 'wheel';
      vetoes?: number;
    }) =>
      rpc<Room>('create_room', {
        p_item_type: input.itemType,
        p_display_name: input.displayName,
        p_options: input.options,
        p_max_participants: input.maxParticipants,
        p_decision_mode: input.mode ?? 'vote',
        p_vetoes: input.vetoes ?? 0,
      }),
    createInvite: (roomId: string) => rpc<string>('create_invite', { p_room_id: roomId }),
    invitePreview: async (token: string) => {
      const rows = await rpc<InvitePreview[]>('invite_preview', { p_token: token });
      return rows[0] ?? null;
    },
    joinByInvite: (token: string, displayName: string) =>
      rpc<Room>('join_room_by_invite', { p_token: token, p_display_name: displayName }),
    joinRoom: (code: string, displayName: string) => rpc<Room>('join_room', { p_code: code, p_display_name: displayName }),
    startVoting: (roomId: string) => rpc<void>('start_voting', { p_room_id: roomId }),
    castVote: (roomId: string, optionId: string, vote: RoomVote) =>
      rpc<void>('cast_vote', { p_room_id: roomId, p_option_id: optionId, p_vote: vote }),
    voteDuel: (roomId: string, duelNo: number, optionId: string) =>
      rpc<void>('vote_duel', { p_room_id: roomId, p_duel_no: duelNo, p_option_id: optionId }),
    submitRanking: (roomId: string, optionIds: string[]) => rpc<void>('submit_ranking', { p_room_id: roomId, p_option_ids: optionIds }),
    spinLiveWheel: (roomId: string) => rpc<string>('spin_live_wheel', { p_room_id: roomId }),
    castVeto: (roomId: string, optionId: string) => rpc<void>('cast_veto', { p_room_id: roomId, p_option_id: optionId }),
    finishVoting: (roomId: string) => rpc<void>('finish_voting', { p_room_id: roomId }),
    leaveRoom: (roomId: string) => rpc<void>('leave_room', { p_room_id: roomId }),
    closeRoom: (roomId: string) => rpc<void>('close_room', { p_room_id: roomId }),

    async fetchState(roomId: string): Promise<RoomState> {
      const { data: auth } = await client.auth.getUser();
      const me = auth.user?.id ?? '';
      const [room, participants, options, votes, result, vetoes] = await Promise.all([
        client.from('rooms').select('*').eq('id', roomId).single(),
        client.from('room_participants').select('*').eq('room_id', roomId).order('joined_at'),
        client.from('room_options').select('*').eq('room_id', roomId).order('position'),
        client.from('room_votes').select('option_id, vote').eq('room_id', roomId),
        client.from('room_results').select('*').eq('room_id', roomId).maybeSingle(),
        client.from('room_vetoes').select('option_id').eq('room_id', roomId),
      ]);
      for (const r of [room, participants, options, votes, result, vetoes]) {
        if (r.error) throw new Error(r.error.code === 'PGRST116' ? 'room_not_found' : r.error.message);
      }
      return {
        room: room.data,
        participants: participants.data ?? [],
        options: options.data ?? [],
        myVotes: Object.fromEntries((votes.data ?? []).map((v: { option_id: string; vote: RoomVote }) => [v.option_id, v.vote])),
        result: result.data ?? null,
        myVetoes: (vetoes.data ?? []).map((v: { option_id: string }) => v.option_id),
        me,
      };
    },

    /** Avisa quando algo muda na sala. Devolve a função para cancelar. */
    subscribe(roomId: string, onChange: () => void): () => void {
      const channel: RealtimeChannel = client
        .channel(`room:${roomId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_results', filter: `room_id=eq.${roomId}` }, onChange)
        .subscribe((status) => {
          // Ao reconectar, busca o estado de novo para não perder nada que mudou offline.
          if (status === 'SUBSCRIBED') onChange();
        });
      return () => {
        client.removeChannel(channel);
      };
    },
  };
}

export type RoomsRepository = ReturnType<typeof roomsRepository>;

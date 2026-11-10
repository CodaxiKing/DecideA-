import type { SupabaseClient } from '@supabase/supabase-js';

export type Presence = 'online' | 'busy' | 'offline';
export type InvitePolicy = 'friends' | 'online_friends' | 'nobody';

export interface Friend {
  user_id: string;
  username: string | null;
  display_name: string | null;
  presence: Presence;
  last_seen_at: string | null;
}

export interface PersonRef {
  user_id: string;
  username: string | null;
  display_name: string | null;
}

export interface FriendRequest extends PersonRef {
  id: string;
  created_at: string;
}

export interface RoomInvite {
  id: string;
  room_id: string;
  from_name: string;
  item_type: string;
  decision_mode: string;
  expires_at: string;
  participants: string[];
}

export interface Group {
  id: string;
  name: string;
  is_owner: boolean;
  members: { user_id: string; name: string | null }[];
  created_at: string;
}

export interface PairLink {
  id: string;
  status: 'pending' | 'accepted';
  i_requested: boolean;
  partner_id: string;
  partner_name: string | null;
  accepted_at: string | null;
}

export interface SocialSettings {
  username: string | null;
  show_presence: boolean;
  invite_policy: InvitePolicy;
  discoverable: boolean;
  notify_invites: boolean;
}

/** Amigos, presença, convites diretos, grupos e dupla (Fase 14). */
export function socialRepository(client: SupabaseClient) {
  const rpc = async <T>(fn: string, args: Record<string, unknown> = {}): Promise<T> => {
    const { data, error } = await client.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data as T;
  };

  return {
    async mySettings(userId: string): Promise<SocialSettings> {
      const { data, error } = await client
        .from('profiles')
        .select('username, show_presence, invite_policy, discoverable, notify_invites')
        .eq('id', userId)
        .single();
      if (error) throw new Error(error.message);
      return data as SocialSettings;
    },
    setUsername: (username: string) => rpc<void>('set_username', { p_username: username }),
    updateSettings: (s: Omit<SocialSettings, 'username'>) =>
      rpc<void>('update_social_settings', {
        p_show_presence: s.show_presence,
        p_invite_policy: s.invite_policy,
        p_discoverable: s.discoverable,
        p_notify_invites: s.notify_invites,
      }),
    heartbeat: (status: 'online' | 'busy' = 'online') => rpc<void>('heartbeat', { p_status: status }),
    goOffline: () => rpc<void>('go_offline'),

    friends: () => rpc<Friend[]>('my_friends'),
    pendingRequests: () => rpc<FriendRequest[]>('pending_friend_requests'),
    findUser: async (username: string) => (await rpc<PersonRef[]>('find_user', { p_username: username.replace(/^@/, '') }))[0] ?? null,
    decidedWithMe: () => rpc<(PersonRef & { last_room_at: string })[]>('decided_with_me'),
    sendRequest: (userId: string) => rpc<'sent' | 'accepted' | 'already_sent' | 'already_friends'>('send_friend_request', { p_user_id: userId }),
    respondRequest: (id: string, accept: boolean) => rpc<void>('respond_friend_request', { p_request_id: id, p_accept: accept }),
    removeFriend: (userId: string) => rpc<void>('remove_friend', { p_user_id: userId }),
    block: (userId: string) => rpc<void>('block_user', { p_user_id: userId }),
    unblock: (userId: string) => rpc<void>('unblock_user', { p_user_id: userId }),
    blocked: () => rpc<PersonRef[]>('blocked_users'),
    createFriendInvite: () => rpc<string>('create_friend_invite'),
    acceptFriendInvite: (token: string) => rpc<string>('accept_friend_invite', { p_token: token }),

    inviteToRoom: (roomId: string, userIds: string[]) => rpc<number>('invite_friends_to_room', { p_room_id: roomId, p_user_ids: userIds }),
    roomInvites: () => rpc<RoomInvite[]>('my_room_invites'),
    respondRoomInvite: (id: string, accept: boolean, displayName?: string) =>
      rpc<string | null>('respond_room_invite', { p_invite_id: id, p_accept: accept, p_display_name: displayName ?? null }),

    groups: () => rpc<Group[]>('my_groups'),
    createGroup: (name: string, memberIds: string[]) => rpc<string>('create_group', { p_name: name, p_member_ids: memberIds }),
    leaveGroup: (groupId: string) => rpc<void>('leave_group', { p_group_id: groupId }),

    pair: async () => (await rpc<PairLink[]>('my_pair'))[0] ?? null,
    requestPair: (userId: string) => rpc<void>('request_pair', { p_user_id: userId }),
    respondPair: (accept: boolean) => rpc<void>('respond_pair', { p_accept: accept }),
    unpair: () => rpc<void>('unpair'),
    async partnerFavorites(partnerId: string) {
      const [foods, movies] = await Promise.all([
        client.from('favorite_foods').select('recipe_id').eq('user_id', partnerId),
        client.from('favorite_movies').select('movie_id').eq('user_id', partnerId),
      ]);
      return {
        foods: (foods.data ?? []).map((f: { recipe_id: string }) => f.recipe_id),
        movies: (movies.data ?? []).map((m: { movie_id: string }) => m.movie_id),
      };
    },

    /** Avisa quando chegam pedidos ou convites. Devolve a função para cancelar. */
    subscribe(userId: string, onChange: () => void): () => void {
      const channel = client
        .channel(`social:${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_friend_invites', filter: `to_id=eq.${userId}` }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pair_links' }, onChange)
        .subscribe();
      return () => {
        client.removeChannel(channel);
      };
    },
  };
}

export type SocialRepository = ReturnType<typeof socialRepository>;

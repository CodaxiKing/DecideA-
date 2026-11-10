import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';

import { socialRepository } from '../../repositories/socialRepository';
import { useAuth } from '../../services/auth';
import { requireSupabase, supabase } from '../../services/supabase';

export function socialRepo() {
  return socialRepository(requireSupabase());
}

/** Dados sociais de quem tem conta, atualizados em tempo real. */
export function useSocial() {
  const { user, registered } = useAuth();
  const userId = registered ? user!.id : undefined;
  const repo = useMemo(() => (supabase ? socialRepository(supabase) : null), []);
  const enabled = !!repo && !!userId;

  const settings = useQuery({ queryKey: ['social', 'settings', userId], queryFn: () => repo!.mySettings(userId!), enabled });
  const friends = useQuery({ queryKey: ['social', 'friends'], queryFn: () => repo!.friends(), enabled, refetchInterval: 60000 });
  const requests = useQuery({ queryKey: ['social', 'requests'], queryFn: () => repo!.pendingRequests(), enabled });
  const roomInvites = useQuery({ queryKey: ['social', 'roomInvites'], queryFn: () => repo!.roomInvites(), enabled, refetchInterval: 30000 });
  const groups = useQuery({ queryKey: ['social', 'groups'], queryFn: () => repo!.groups(), enabled });
  const pair = useQuery({ queryKey: ['social', 'pair'], queryFn: () => repo!.pair(), enabled });

  return { userId, registered, settings, friends, requests, roomInvites, groups, pair };
}

export function useInvalidateSocial() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['social'] });
}

/**
 * Sinal de presença: a cada minuto com o app aberto; ao sair, aparece offline.
 * Guarda só o último sinal no servidor (sem histórico).
 */
export function PresenceManager() {
  const { user, registered } = useAuth();
  const queryClient = useQueryClient();
  const userId = registered ? user!.id : undefined;

  // Uma única assinatura de tempo real para pedidos, convites e dupla.
  useEffect(() => {
    if (!userId || !supabase) return;
    return socialRepository(supabase).subscribe(userId, () => queryClient.invalidateQueries({ queryKey: ['social'] }));
  }, [userId, queryClient]);

  useEffect(() => {
    if (!registered || !supabase) return;
    const repo = socialRepository(supabase);
    const beat = () => repo.heartbeat().catch(() => {});
    beat();
    let timer: ReturnType<typeof setInterval> | undefined = setInterval(beat, 60000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        beat();
        if (!timer) timer = setInterval(beat, 60000);
      } else {
        if (timer) clearInterval(timer);
        timer = undefined;
        repo.goOffline().catch(() => {});
      }
    });
    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [registered]);

  return null;
}

/** "Visto há 2 h", "Visto ontem". */
export function lastSeenLabel(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'Offline';
  const min = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `Visto há ${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Visto há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'Visto ontem' : `Visto há ${d} dias`;
}

export function personName(p: { display_name: string | null; username: string | null }): string {
  return p.display_name || (p.username ? `@${p.username}` : 'Alguém');
}

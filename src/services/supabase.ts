import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/**
 * Cliente do Supabase. Só usa a chave pública (anon/publishable): nenhuma chave
 * administrativa entra no app. Sem as variáveis, as funções online ficam
 * desligadas e o app avisa (modo local).
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isBackendConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isBackendConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export class BackendUnavailableError extends Error {
  constructor() {
    super('backend_unavailable');
  }
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new BackendUnavailableError();
  return supabase;
}

/**
 * Garante uma sessão: usa a conta da pessoa se ela entrou, senão cria uma
 * sessão anônima (convidado sem cadastro).
 */
export async function ensureSession(): Promise<string> {
  const client = requireSupabase();
  const { data } = await client.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: anon, error } = await client.auth.signInAnonymously();
  if (error || !anon.user) throw error ?? new Error('auth_failed');
  return anon.user.id;
}

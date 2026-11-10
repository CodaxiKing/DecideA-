import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';

import { requireSupabase, supabase } from './supabase';

export interface AuthUser {
  id: string;
  email?: string;
  isAnonymous: boolean;
}

function toUser(session: Session | null): AuthUser | null {
  if (!session) return null;
  return { id: session.user.id, email: session.user.email ?? undefined, isAnonymous: !!session.user.is_anonymous };
}

/** Conta atual (null = ninguém; isAnonymous = convidado das salas). */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session));
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(toUser(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  return { user, ready, registered: !!user && !user.isAnonymous };
}

export const authErrorMessages: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Já existe uma conta com esse e-mail. Tente entrar.',
  'already been registered': 'Já existe uma conta com esse e-mail. Tente entrar.',
  'Password should be at least': 'A senha precisa ter pelo menos 8 caracteres.',
  'Unable to validate email address': 'Esse e-mail não parece válido.',
  'Email not confirmed': 'Confirme seu e-mail pelo link que enviamos.',
  'For security purposes': 'Muitas tentativas. Espere um pouco e tente de novo.',
  rate_limit: 'Muitas tentativas. Espere um pouco e tente de novo.',
  backend_unavailable: 'Contas precisam do servidor, que não está configurado neste app.',
};

export function authErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const key = Object.keys(authErrorMessages).find((k) => raw.includes(k));
  if (key) return authErrorMessages[key];
  if (/network|fetch/i.test(raw)) return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  return 'Não deu certo. Tente de novo.';
}

export function validateCredentials(email: string, password: string): string | undefined {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Digite um e-mail válido.';
  if (password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  return undefined;
}

/**
 * Cria a conta. Se o aparelho já tem uma sessão anônima (de uma sala), ela vira a
 * conta: o mesmo usuário, sem perder a participação nas salas.
 */
export async function signUp(email: string, password: string): Promise<void> {
  const client = requireSupabase();
  const { data } = await client.auth.getSession();
  if (data.session?.user.is_anonymous) {
    const { error } = await client.auth.updateUser({ email: email.trim(), password });
    if (error) throw error;
    // O token antigo ainda diz "anônimo"; renova para as regras de acesso valerem já.
    await client.auth.refreshSession();
    return;
  }
  const { error } = await client.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await requireSupabase().auth.signOut();
}

export const passwordResetRedirect = () => Linking.createURL('/conta/nova-senha');

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: passwordResetRedirect() });
  if (error) throw error;
}

/** Troca o código do link de recuperação por uma sessão e define a nova senha. */
export async function completePasswordReset(code: string, newPassword: string): Promise<void> {
  const client = requireSupabase();
  const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Apaga a conta e tudo dela no servidor (cascata no banco) e sai. */
export async function deleteAccount(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc('delete_account');
  if (error) throw new Error(error.message);
  await client.auth.signOut({ scope: 'local' });
}

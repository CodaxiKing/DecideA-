// Webhook do RevenueCat: mantém public.user_entitlements em dia.
// Configuração (segredos da função, nunca no app):
//   REVENUECAT_WEBHOOK_AUTH  – o mesmo valor do "Authorization header" do webhook no painel do RevenueCat
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY – já disponíveis nas Edge Functions
// O app_user_id do RevenueCat é o id da conta no Supabase (Purchases.logIn(userId)).

import { createClient } from 'npm:@supabase/supabase-js@2';

import { entitlementChange, type RevenueCatEvent } from './logic.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });

  const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!expected || req.headers.get('Authorization') !== expected) {
    return new Response('unauthorized', { status: 401 });
  }

  let body: { event?: RevenueCatEvent };
  try {
    body = await req.json();
  } catch {
    return new Response('bad_request', { status: 400 });
  }
  const change = body.event ? entitlementChange(body.event) : null;
  if (!change) return new Response('ignored', { status: 200 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { error } =
    change.kind === 'grant'
      ? await admin.from('user_entitlements').upsert({
          user_id: change.userId,
          entitlement: 'premium',
          expires_at: change.expiresAt,
          product_id: change.productId,
          source: 'revenuecat',
          updated_at: new Date().toISOString(),
        })
      : await admin.from('user_entitlements').delete().eq('user_id', change.userId).eq('entitlement', 'premium');

  if (error) return new Response('db_error', { status: 500 });
  return new Response('ok', { status: 200 });
});

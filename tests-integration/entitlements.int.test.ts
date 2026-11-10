/**
 * Premium confirmado no servidor: o tamanho e a duração da sala dependem do
 * registro em user_entitlements, que só o backend (chave de serviço) grava.
 * SUPABASE_SERVICE_ROLE_KEY vem de `npx supabase status` (só no ambiente local de teste).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { roomsRepository } from '../src/repositories/roomsRepository';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54421';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const client = (key = anonKey): SupabaseClient => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const options = [
  { ref_id: 'a', title: 'A' },
  { ref_id: 'b', title: 'B' },
];
const minutesUntil = (iso: string) => (new Date(iso).getTime() - Date.now()) / 60000;

jest.setTimeout(30000);

describe('Premium no servidor', () => {
  it('sala grátis fica em 4 pessoas e 30 minutos, mesmo pedindo mais', async () => {
    const c = client();
    await c.auth.signUp({ email: `free-${globalThis.crypto.randomUUID().slice(0, 8)}@exemplo.test`, password: 'senha-segura-123' });
    const room = await roomsRepository(c).createRoom({ itemType: 'food', displayName: 'Ana', options, maxParticipants: 20 });
    expect(room.max_participants).toBe(4);
    expect(minutesUntil(room.expires_at)).toBeLessThanOrEqual(30.1);
  });

  it('o app não consegue se dar Premium', async () => {
    const c = client();
    const { data } = await c.auth.signUp({ email: `hack-${globalThis.crypto.randomUUID().slice(0, 8)}@exemplo.test`, password: 'senha-segura-123' });
    const res = await c.from('user_entitlements').insert({ user_id: data.user!.id, entitlement: 'premium' });
    expect(res.error).not.toBeNull();
  });

  it('com direito ativo, a sala vai a 12 pessoas e 2 horas; expirado volta ao grátis', async () => {
    if (!serviceKey) throw new Error('defina SUPABASE_SERVICE_ROLE_KEY');
    const admin = client(serviceKey);
    const c = client();
    const { data } = await c.auth.signUp({ email: `pro-${globalThis.crypto.randomUUID().slice(0, 8)}@exemplo.test`, password: 'senha-segura-123' });
    const userId = data.user!.id;

    await admin.from('user_entitlements').upsert({ user_id: userId, entitlement: 'premium', expires_at: new Date(Date.now() + 86400000).toISOString() });
    const own = await c.from('user_entitlements').select('entitlement');
    expect(own.data).toEqual([{ entitlement: 'premium' }]);
    const pro = await roomsRepository(c).createRoom({ itemType: 'movie', displayName: 'Ana', options, maxParticipants: 20 });
    expect(pro.max_participants).toBe(12);
    expect(minutesUntil(pro.expires_at)).toBeGreaterThan(100);

    await admin.from('user_entitlements').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('user_id', userId);
    const back = await roomsRepository(c).createRoom({ itemType: 'movie', displayName: 'Ana', options, maxParticipants: 20 });
    expect(back.max_participants).toBe(4);
  });
});

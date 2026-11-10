/**
 * Contas e sincronização contra o Supabase local.
 * Dois clientes na mesma conta fazem o papel de dois aparelhos.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { mergeWheels } from '../src/features/sync/merge';
import { roomsRepository } from '../src/repositories/roomsRepository';
import { syncRepository } from '../src/repositories/syncRepository';

const randomUUID = () => globalThis.crypto.randomUUID();

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54421';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const client = (): SupabaseClient => createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const email = () => `teste-${randomUUID().slice(0, 8)}@exemplo.test`;
const PASSWORD = 'senha-segura-123';

jest.setTimeout(30000);

describe('contas', () => {
  it('sincroniza roletas, favoritos e histórico entre dois aparelhos sem duplicar', async () => {
    const addr = email();
    const phone = client();
    const { data: up, error } = await phone.auth.signUp({ email: addr, password: PASSWORD });
    expect(error).toBeNull();
    const userId = up.user!.id;

    const tablet = client();
    await tablet.auth.signInWithPassword({ email: addr, password: PASSWORD });

    const now = new Date().toISOString();
    const w = { id: randomUUID(), name: 'Jantar', createdAt: now, updatedAt: now, options: [{ id: randomUUID(), label: 'Pizza' }, { id: randomUUID(), label: 'Sushi' }] };
    const phoneRepo = syncRepository(phone, userId);
    await phoneRepo.pushWheels([w]);
    await phoneRepo.pushWheels([w]); // reenviar não duplica
    await phoneRepo.pushFavorites([{ kind: 'food', id: 'bolo-cenoura', addedAt: now }]);
    await phoneRepo.pushFavorites([{ kind: 'food', id: 'bolo-cenoura', addedAt: now }]);
    const entry = { id: randomUUID(), kind: 'wheel' as const, title: 'Pizza', source: 'Roleta Jantar', createdAt: now };
    await phoneRepo.pushHistory([entry]);
    await phoneRepo.pushHistory([entry]);

    const tabletRepo = syncRepository(tablet, userId);
    const wheels = await tabletRepo.pullWheels();
    expect(wheels).toHaveLength(1);
    expect(wheels[0].options.map((o) => o.label)).toEqual(['Pizza', 'Sushi']);
    expect(wheels[0].updatedAt).toBe(w.updatedAt);
    expect(await tabletRepo.pullFavorites()).toHaveLength(1);
    expect(await tabletRepo.pullHistory(50)).toHaveLength(1);

    // Edição no tablet, mais nova, vence ao mesclar no celular.
    const edited = { ...wheels[0], name: 'Jantar de sexta', updatedAt: new Date(Date.now() + 1000).toISOString() };
    await tabletRepo.pushWheels([edited]);
    const merged = mergeWheels([w], await phoneRepo.pullWheels());
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Jantar de sexta');

    await phoneRepo.deleteWheels([w.id]);
    await phoneRepo.deleteFavorites([{ kind: 'food', id: 'bolo-cenoura' }]);
    expect(await tabletRepo.pullWheels()).toEqual([]);
    expect(await tabletRepo.pullFavorites()).toEqual([]);
  });

  it('ninguém lê os dados de outra conta', async () => {
    const a = client();
    const { data: ua } = await a.auth.signUp({ email: email(), password: PASSWORD });
    const now = new Date().toISOString();
    await syncRepository(a, ua.user!.id).pushFavorites([{ kind: 'movie', id: 'ultima-balsa', addedAt: now }]);

    const b = client();
    const { data: ub } = await b.auth.signUp({ email: email(), password: PASSWORD });
    expect(await syncRepository(b, ub.user!.id).pullFavorites()).toEqual([]);
    // Nem gravando em nome da outra pessoa.
    const forged = await b.from('favorite_movies').insert({ user_id: ua.user!.id, movie_id: 'x' });
    expect(forged.error).not.toBeNull();
  });

  it('convidado anônimo não sincroniza', async () => {
    const guest = client();
    const { data } = await guest.auth.signInAnonymously();
    const res = await guest.from('favorite_foods').insert({ user_id: data.user!.id, recipe_id: 'x' });
    expect(res.error).not.toBeNull();
  });

  it('convidado vira conta sem perder as salas', async () => {
    const guest = client();
    const { data } = await guest.auth.signInAnonymously();
    const room = await roomsRepository(guest).createRoom({
      itemType: 'food',
      displayName: 'Bia',
      options: [
        { ref_id: 'a', title: 'A' },
        { ref_id: 'b', title: 'B' },
      ],
      maxParticipants: 4,
    });
    const { error } = await guest.auth.updateUser({ email: email(), password: PASSWORD });
    expect(error).toBeNull();
    // O token novo traz is_anonymous = false.
    await guest.auth.refreshSession();
    const { data: after } = await guest.auth.getUser();
    expect(after.user!.id).toBe(data.user!.id);
    expect(after.user!.is_anonymous).toBe(false);
    const state = await roomsRepository(guest).fetchState(room.id);
    expect(state.participants[0].display_name).toBe('Bia');
    await syncRepository(guest, after.user!.id).pushFavorites([{ kind: 'food', id: 'x', addedAt: new Date().toISOString() }]);
  });

  it('excluir conta apaga os dados e o acesso', async () => {
    const addr = email();
    const c = client();
    const { data } = await c.auth.signUp({ email: addr, password: PASSWORD });
    const repo = syncRepository(c, data.user!.id);
    await repo.pushFavorites([{ kind: 'food', id: 'x', addedAt: new Date().toISOString() }]);
    const profile = await c.from('profiles').select('id').eq('id', data.user!.id);
    expect(profile.data).toHaveLength(1);

    const del = await c.rpc('delete_account');
    expect(del.error).toBeNull();

    const again = client();
    const login = await again.auth.signInWithPassword({ email: addr, password: PASSWORD });
    expect(login.error).not.toBeNull();
  });

  it('memória de preferências e "Deu certo?" sincronizam', async () => {
    const c = client();
    const { data } = await c.auth.signUp({ email: email(), password: PASSWORD });
    const repo = syncRepository(c, data.user!.id);
    const at = new Date().toISOString();
    await repo.pushSignals([{ kind: 'food', id: 'bolo-cenoura', accepted: 3, rejected: 1, updatedAt: at }]);
    await repo.pushSignals([{ kind: 'food', id: 'bolo-cenoura', accepted: 4, rejected: 1, updatedAt: at }]);
    expect(await repo.pullSignals()).toEqual([{ kind: 'food', id: 'bolo-cenoura', accepted: 4, rejected: 1, updatedAt: at }]);
    const e = { id: randomUUID(), kind: 'food' as const, title: 'Bolo', source: 'Sorteio', refId: 'bolo-cenoura', createdAt: at };
    await repo.pushHistory([e]);
    await repo.pushHistory([{ ...e, feedback: 'liked' }]);
    expect((await repo.pullHistory(5))[0].feedback).toBe('liked');
    await repo.clearSignals();
    expect(await repo.pullSignals()).toEqual([]);
  });
});

/**
 * Fase 14: amigos, presença, bloqueio, convites diretos, grupos, dupla e os
 * modos Batalha em grupo, Ranking coletivo e Roleta ao vivo.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { roomsRepository } from '../src/repositories/roomsRepository';
import { socialRepository } from '../src/repositories/socialRepository';
import { syncRepository } from '../src/repositories/syncRepository';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54421';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const uid = () => globalThis.crypto.randomUUID().slice(0, 8);

async function person(name: string) {
  const client: SupabaseClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signUp({ email: `${name}-${uid()}@exemplo.test`, password: 'senha-segura-123' });
  if (error) throw error;
  const social = socialRepository(client);
  const username = `${name}_${uid()}`.slice(0, 20);
  await social.setUsername(username);
  await client.from('profiles').update({ display_name: name }).eq('id', data.user!.id);
  return { client, id: data.user!.id, username, social, rooms: roomsRepository(client), sync: syncRepository(client, data.user!.id) };
}

async function befriend(a: Awaited<ReturnType<typeof person>>, b: Awaited<ReturnType<typeof person>>) {
  await a.social.sendRequest(b.id);
  const [req] = await b.social.pendingRequests();
  await b.social.respondRequest(req.id, true);
}

const four = [
  { ref_id: 'a', title: 'A' },
  { ref_id: 'b', title: 'B' },
  { ref_id: 'c', title: 'C' },
  { ref_id: 'd', title: 'D' },
];

jest.setTimeout(40000);

describe('amigos', () => {
  it('nome de usuário único e validado', async () => {
    const ana = await person('ana');
    const bia = await person('bia');
    await expect(bia.social.setUsername(ana.username)).rejects.toThrow('username_taken');
    await expect(bia.social.setUsername('A!')).rejects.toThrow('invalid_username');
  });

  it('pedido aceito vira amizade; duplicado não repete; presença respeita privacidade', async () => {
    const ana = await person('ana');
    const caio = await person('caio');
    expect((await ana.social.findUser(`@${caio.username}`))?.user_id).toBe(caio.id);
    expect(await ana.social.sendRequest(caio.id)).toBe('sent');
    expect(await ana.social.sendRequest(caio.id)).toBe('already_sent');
    // Caio pedir de volta aceita o pedido da Ana.
    expect(await caio.social.sendRequest(ana.id)).toBe('accepted');
    expect(await ana.social.sendRequest(caio.id)).toBe('already_friends');

    await caio.social.heartbeat();
    let friends = await ana.social.friends();
    expect(friends).toHaveLength(1);
    expect(friends[0].presence).toBe('online');

    // Caio esconde a presença: aparece offline e sem "visto por último".
    await caio.social.updateSettings({ show_presence: false, invite_policy: 'friends', discoverable: true, notify_invites: true });
    friends = await ana.social.friends();
    expect(friends[0]).toMatchObject({ presence: 'offline', last_seen_at: null });
    // E quem esconde a própria também não vê a dos outros.
    await ana.social.heartbeat();
    expect((await caio.social.friends())[0].presence).toBe('offline');
  });

  it('pedido recusado some; quem não quer ser achado não aparece na busca', async () => {
    const ana = await person('ana');
    const duda = await person('duda');
    await ana.social.sendRequest(duda.id);
    const [req] = await duda.social.pendingRequests();
    await duda.social.respondRequest(req.id, false);
    expect(await duda.social.pendingRequests()).toEqual([]);
    expect(await ana.social.friends()).toEqual([]);
    await duda.social.updateSettings({ show_presence: true, invite_policy: 'friends', discoverable: false, notify_invites: true });
    expect(await ana.social.findUser(duda.username)).toBeNull();
  });

  it('bloqueio desfaz amizade, some da busca, impede pedido e convite', async () => {
    const ana = await person('ana');
    const vini = await person('vini');
    await befriend(ana, vini);
    await ana.social.block(vini.id);
    expect(await ana.social.friends()).toEqual([]);
    expect(await vini.social.findUser(ana.username)).toBeNull();
    // O pedido "parece" enviado, mas não chega.
    expect(await vini.social.sendRequest(ana.id)).toBe('sent');
    expect(await ana.social.pendingRequests()).toEqual([]);
    expect((await ana.social.blocked()).map((b) => b.user_id)).toEqual([vini.id]);
    await ana.social.unblock(vini.id);
    expect(await ana.social.blocked()).toEqual([]);
  });

  it('convite de amizade por link já nasce aceito', async () => {
    const ana = await person('ana');
    const leo = await person('leo');
    const token = await ana.social.createFriendInvite();
    expect(await leo.social.acceptFriendInvite(token)).toBe('ana');
    expect((await ana.social.friends()).map((f) => f.user_id)).toEqual([leo.id]);
    await expect(ana.social.acceptFriendInvite(token)).rejects.toThrow('invalid_user');
  });

  it('convite direto para sala: só amigos, respeita "ninguém" e expira com a sala', async () => {
    const ana = await person('ana');
    const bia = await person('bia');
    const estranho = await person('zeca');
    const timida = await person('tati');
    await befriend(ana, bia);
    await befriend(ana, timida);
    await timida.social.updateSettings({ show_presence: true, invite_policy: 'nobody', discoverable: true, notify_invites: true });
    const room = await ana.rooms.createRoom({ itemType: 'food', displayName: 'Ana', options: four, maxParticipants: 4, mode: 'battle' });
    expect(await ana.social.inviteToRoom(room.id, [bia.id, estranho.id, timida.id])).toBe(1);
    expect(await estranho.social.roomInvites()).toEqual([]);
    expect(await timida.social.roomInvites()).toEqual([]);
    const [inv] = await bia.social.roomInvites();
    expect(inv).toMatchObject({ from_name: 'ana', decision_mode: 'battle', participants: ['Ana'] });
    expect(await bia.social.respondRoomInvite(inv.id, true)).toBe(room.id);
    expect((await ana.rooms.fetchState(room.id)).participants).toHaveLength(2);
  });

  it('grupos: Premium no servidor; só amigos entram; quem sai some; dono apaga', async () => {
    const ana = await person('ana');
    const bia = await person('bia');
    const zeca = await person('zeca');
    await befriend(ana, bia);
    await expect(ana.social.createGroup('Família', [bia.id])).rejects.toThrow('premium_required');
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    await admin.from('user_entitlements').upsert({ user_id: ana.id, entitlement: 'premium', expires_at: new Date(Date.now() + 86400000).toISOString() });
    const gid = await ana.social.createGroup('Família', [bia.id, zeca.id]);
    const [g] = await bia.social.groups();
    expect(g.id).toBe(gid);
    expect(g.members.map((m) => m.user_id).sort()).toEqual([ana.id, bia.id].sort());
    expect(await zeca.social.groups()).toEqual([]);
    await bia.social.leaveGroup(gid);
    expect(await bia.social.groups()).toEqual([]);
    await ana.social.leaveGroup(gid);
    expect(await ana.social.groups()).toEqual([]);
  });

  it('dupla: aceite dos dois lados, favoritos compartilhados e desfazer simples', async () => {
    const ana = await person('ana');
    const caio = await person('caio');
    const bia = await person('bia');
    await befriend(ana, caio);
    await expect(ana.social.requestPair(bia.id)).rejects.toThrow('not_friends');
    await ana.social.requestPair(caio.id);
    expect((await caio.social.pair())?.status).toBe('pending');
    await caio.sync.pushFavorites([{ kind: 'food', id: 'temaki-salmao', addedAt: new Date().toISOString() }]);
    // Antes de aceitar, a Ana não vê os favoritos do Caio.
    expect((await ana.social.partnerFavorites(caio.id)).foods).toEqual([]);
    await caio.social.respondPair(true);
    expect((await ana.social.partnerFavorites(caio.id)).foods).toEqual(['temaki-salmao']);
    await befriend(ana, bia);
    await expect(ana.social.requestPair(bia.id)).rejects.toThrow('already_paired');
    await ana.social.unpair();
    expect(await caio.social.pair()).toBeNull();
    expect((await ana.social.partnerFavorites(caio.id)).foods).toEqual([]);
  });
});

describe('modos de sala', () => {
  it('Batalha em grupo: todos votam em cada duelo, até o vencedor', async () => {
    const ana = await person('ana');
    const bia = await person('bia');
    const room = await ana.rooms.createRoom({ itemType: 'food', displayName: 'Ana', options: four, maxParticipants: 4, mode: 'battle' });
    await bia.rooms.joinRoom(room.code, 'Bia');
    await ana.rooms.startVoting(room.id);
    for (let guard = 0; guard < 5; guard++) {
      const s = await ana.rooms.fetchState(room.id);
      if (s.room.status === 'closed') break;
      const st = s.room.battle_state!;
      const [x, y] = [st.current[st.index], st.current[st.index + 1]];
      const pref = (id: string) => s.options.find((o) => o.id === id)!.ref_id;
      const best = pref(x) < pref(y) ? x : y; // os dois preferem a letra menor
      await ana.rooms.voteDuel(room.id, st.duel, best);
      // Antes do segundo voto, o duelo não anda.
      expect((await bia.rooms.fetchState(room.id)).room.battle_state!.duel).toBe(st.duel);
      await bia.rooms.voteDuel(room.id, st.duel, best);
    }
    const end = await bia.rooms.fetchState(room.id);
    expect(end.room.status).toBe('closed');
    expect(end.options.find((o) => o.id === end.result!.winner_option_id)?.ref_id).toBe('a');
  });

  it('Ranking coletivo: contagem de Borda', async () => {
    const ana = await person('ana');
    const bia = await person('bia');
    const room = await ana.rooms.createRoom({ itemType: 'movie', displayName: 'Ana', options: four, maxParticipants: 4, mode: 'ranking' });
    await bia.rooms.joinRoom(room.code, 'Bia');
    await ana.rooms.startVoting(room.id);
    const s = await ana.rooms.fetchState(room.id);
    const id = (ref: string) => s.options.find((o) => o.ref_id === ref)!.id;
    await expect(ana.rooms.submitRanking(room.id, [id('a'), id('a'), id('b'), id('c')])).rejects.toThrow('invalid_options');
    await ana.rooms.submitRanking(room.id, [id('b'), id('a'), id('c'), id('d')]);
    await bia.rooms.submitRanking(room.id, [id('a'), id('c'), id('b'), id('d')]);
    const r = (await ana.rooms.fetchState(room.id)).result!;
    // a = 2 + 3 = 5; b = 3 + 1 = 4; c = 1 + 2 = 3; d = 0
    expect(r.winner_option_id).toBe(id('a'));
    expect(r.ranking.map((x) => [x.title, x.score])).toEqual([
      ['A', 5],
      ['B', 4],
      ['C', 3],
      ['D', 0],
    ]);
  });

  it('Roleta ao vivo: só o anfitrião gira e todos recebem o mesmo resultado', async () => {
    const ana = await person('ana');
    const bia = await person('bia');
    const room = await ana.rooms.createRoom({ itemType: 'custom', displayName: 'Ana', options: four, maxParticipants: 4, mode: 'wheel' });
    await bia.rooms.joinRoom(room.code, 'Bia');
    await expect(bia.rooms.spinLiveWheel(room.id)).rejects.toThrow('host_only');
    const winner = await ana.rooms.spinLiveWheel(room.id);
    const a = (await ana.rooms.fetchState(room.id)).result!;
    const b = (await bia.rooms.fetchState(room.id)).result!;
    expect(a.winner_option_id).toBe(winner);
    expect(b.winner_option_id).toBe(winner);
    expect(b.spin_offset).toBe(a.spin_offset);
    expect(a.spin_offset!).toBeGreaterThanOrEqual(0.15);
    // Girar de novo devolve o mesmo resultado.
    expect(await ana.rooms.spinLiveWheel(room.id)).toBe(winner);
  });
});

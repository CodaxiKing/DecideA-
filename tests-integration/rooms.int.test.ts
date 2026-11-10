/**
 * Integração das salas contra um Supabase local (npx supabase start).
 * Dois clientes anônimos fazem o papel de dois aparelhos.
 * Rodar com: npm run test:integration
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { roomsRepository } from '../src/repositories/roomsRepository';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';

function device(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signedIn() {
  const client = device();
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  return { client, repo: roomsRepository(client), userId: data.user!.id };
}

const options = [
  { ref_id: 'pizza', title: 'Pizza' },
  { ref_id: 'sushi', title: 'Sushi' },
  { ref_id: 'massa', title: 'Massa' },
];

jest.setTimeout(30000);

describe('salas em dispositivos distintos', () => {
  it('criar, entrar, votar e ver o mesmo resultado nos dois aparelhos', async () => {
    const ana = await signedIn();
    const caio = await signedIn();

    const room = await ana.repo.createRoom({ itemType: 'food', displayName: 'Ana', options, maxParticipants: 4 });
    expect(room.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(room.status).toBe('lobby');

    // Caio ainda não está na sala: não enxerga nada dela.
    const before = await caio.client.from('rooms').select('id').eq('id', room.id);
    expect(before.data).toEqual([]);

    const joined = await caio.repo.joinRoom(room.code.toLowerCase(), 'Caio');
    expect(joined.id).toBe(room.id);

    // Só quem criou começa a votação.
    await expect(caio.repo.startVoting(room.id)).rejects.toThrow('host_only');
    await ana.repo.startVoting(room.id);

    const state = await ana.repo.fetchState(room.id);
    expect(state.participants.map((p) => p.display_name)).toEqual(['Ana', 'Caio']);
    const id = (ref: string) => state.options.find((o) => o.ref_id === ref)!.id;

    await ana.repo.castVote(room.id, id('pizza'), 'yes');
    await ana.repo.castVote(room.id, id('sushi'), 'maybe');
    await ana.repo.castVote(room.id, id('massa'), 'no');
    // Voto repetido substitui o anterior, sem duplicar.
    await ana.repo.castVote(room.id, id('sushi'), 'no');

    await caio.repo.castVote(room.id, id('pizza'), 'yes');
    await caio.repo.castVote(room.id, id('sushi'), 'yes');
    await caio.repo.castVote(room.id, id('massa'), 'no');

    // Votos são secretos: Caio só lê os próprios.
    const caioSees = await caio.client.from('room_votes').select('user_id').eq('room_id', room.id);
    expect(new Set(caioSees.data!.map((v) => v.user_id))).toEqual(new Set([caio.userId]));

    await ana.repo.finishVoting(room.id);
    let mid = await caio.repo.fetchState(room.id);
    expect(mid.room.status).toBe('voting');
    expect(mid.result).toBeNull();

    await caio.repo.finishVoting(room.id);
    const a = await ana.repo.fetchState(room.id);
    const c = await caio.repo.fetchState(room.id);
    expect(a.room.status).toBe('closed');
    expect(a.result?.winner_option_id).toBe(id('pizza'));
    expect(a.result?.unanimous).toBe(true);
    expect(c.result).toEqual(a.result);
    expect(a.result?.ranking[0]).toMatchObject({ title: 'Pizza', yes: 2, maybe: 0, no: 0, score: 4 });

    // Depois de fechada, não aceita voto.
    await expect(caio.repo.castVote(room.id, id('massa'), 'yes')).rejects.toThrow('not_voting');
    mid = c;
  });

  it('reentrada não ocupa outra vaga e sala cheia recusa', async () => {
    const host = await signedIn();
    const room = await host.repo.createRoom({ itemType: 'movie', displayName: 'Host', options, maxParticipants: 2 });
    const guest = await signedIn();
    await guest.repo.joinRoom(room.code, 'Bia');
    await guest.repo.joinRoom(room.code, 'Bia'); // reentrada
    const state = await host.repo.fetchState(room.id);
    expect(state.participants).toHaveLength(2);

    const third = await signedIn();
    await expect(third.repo.joinRoom(room.code, 'Duda')).rejects.toThrow('room_full');
  });

  it('código errado e sala já iniciada', async () => {
    const host = await signedIn();
    const late = await signedIn();
    await expect(late.repo.joinRoom('ZZZZZZ', 'X')).rejects.toThrow('room_not_found');
    const room = await host.repo.createRoom({ itemType: 'food', displayName: 'Host', options, maxParticipants: 4 });
    await host.repo.startVoting(room.id);
    await expect(late.repo.joinRoom(room.code, 'Atrasado')).rejects.toThrow('room_started');
  });

  it('quem sai no meio não trava a sala e o anfitrião pode encerrar', async () => {
    const host = await signedIn();
    const guest = await signedIn();
    const room = await host.repo.createRoom({ itemType: 'food', displayName: 'Host', options, maxParticipants: 4 });
    await guest.repo.joinRoom(room.code, 'Guest');
    await host.repo.startVoting(room.id);
    const s = await host.repo.fetchState(room.id);
    await host.repo.castVote(room.id, s.options[1].id, 'yes');
    await host.repo.finishVoting(room.id);
    expect((await host.repo.fetchState(room.id)).room.status).toBe('voting');

    await guest.repo.leaveRoom(room.id);
    const after = await host.repo.fetchState(room.id);
    expect(after.room.status).toBe('closed');
    expect(after.result?.winner_option_id).toBe(s.options[1].id);
    expect(after.result?.voters).toBe(1);
  });

  it('anfitrião encerra antes de todos terminarem', async () => {
    const host = await signedIn();
    const guest = await signedIn();
    const room = await host.repo.createRoom({ itemType: 'food', displayName: 'Host', options, maxParticipants: 4 });
    await guest.repo.joinRoom(room.code, 'Guest');
    await host.repo.startVoting(room.id);
    const s = await guest.repo.fetchState(room.id);
    await guest.repo.castVote(room.id, s.options[2].id, 'yes');
    await expect(guest.repo.closeRoom(room.id)).rejects.toThrow('host_only');
    await host.repo.closeRoom(room.id);
    const r = await guest.repo.fetchState(room.id);
    expect(r.room.status).toBe('closed');
    expect(r.result?.winner_option_id).toBe(s.options[2].id);
  });

  it('cliente não escreve direto nas tabelas', async () => {
    const someone = await signedIn();
    const res = await someone.client.from('rooms').insert({ code: 'ABCDEF', host_id: someone.userId, item_type: 'food' });
    expect(res.error).not.toBeNull();
  });

  it('notifica em tempo real quando a sala muda', async () => {
    const host = await signedIn();
    const guest = await signedIn();
    const room = await host.repo.createRoom({ itemType: 'food', displayName: 'Host', options, maxParticipants: 4 });
    await guest.repo.joinRoom(room.code, 'Guest');

    let calls = 0;
    let resolveSubscribed!: () => void;
    const subscribed = new Promise<void>((r) => (resolveSubscribed = r));
    const changed = new Promise<void>((resolve) => {
      const stop = guest.repo.subscribe(room.id, () => {
        calls += 1;
        if (calls === 1) resolveSubscribed(); // primeira chamada = conectado
        else {
          stop();
          resolve();
        }
      });
    });
    await subscribed;
    // Dá um instante para o canal ficar pronto do lado do servidor.
    await new Promise((r) => setTimeout(r, 2000));
    await host.repo.startVoting(room.id);
    await changed;
    expect(calls).toBeGreaterThanOrEqual(2);
  });
});

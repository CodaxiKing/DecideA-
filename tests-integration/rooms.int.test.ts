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

  it('Match a dois: só vale o que os dois quiserem, com veto e no máximo 2 pessoas', async () => {
    const ana = await signedIn();
    const caio = await signedIn();
    const extra = await signedIn();
    const four = [...options, { ref_id: 'tapioca', title: 'Tapioca' }];
    const room = await ana.repo.createRoom({ itemType: 'food', displayName: 'Ana', options: four, maxParticipants: 4, mode: 'match', vetoes: 1 });
    expect(room.decision_mode).toBe('match');
    expect(room.max_participants).toBe(2);
    expect(room.vetoes_per_person).toBe(1);
    await caio.repo.joinRoom(room.code, 'Caio');
    await expect(extra.repo.joinRoom(room.code, 'Extra')).rejects.toThrow('room_full');
    await ana.repo.startVoting(room.id);
    const s = await ana.repo.fetchState(room.id);
    const id = (ref: string) => s.options.find((o) => o.ref_id === ref)!.id;

    // Pizza: os dois querem, mas Caio veta. Sushi: os dois querem. Massa: só Ana quer.
    for (const ref of ['pizza', 'sushi', 'massa', 'tapioca']) await ana.repo.castVote(room.id, id(ref), ref === 'tapioca' ? 'no' : 'yes');
    for (const ref of ['pizza', 'sushi']) await caio.repo.castVote(room.id, id(ref), 'yes');
    await caio.repo.castVote(room.id, id('massa'), 'no');
    await caio.repo.castVote(room.id, id('tapioca'), 'no');
    await caio.repo.castVeto(room.id, id('pizza'));
    await expect(caio.repo.castVeto(room.id, id('sushi'))).rejects.toThrow('no_vetoes_left');
    // O veto é secreto até o resultado.
    expect((await ana.repo.fetchState(room.id)).myVetoes).toEqual([]);

    await ana.repo.finishVoting(room.id);
    await caio.repo.finishVoting(room.id);
    const r = (await ana.repo.fetchState(room.id)).result!;
    expect(r.winner_option_id).toBe(id('sushi'));
    expect(r.vetoed_option_ids).toEqual([id('pizza')]);
    expect(r.ranking.find((x) => x.option_id === id('pizza'))?.vetoed).toBe(true);
  });

  it('Match sem nenhuma opção em comum termina sem vencedor', async () => {
    const ana = await signedIn();
    const caio = await signedIn();
    const room = await ana.repo.createRoom({ itemType: 'movie', displayName: 'Ana', options, maxParticipants: 2, mode: 'match' });
    await caio.repo.joinRoom(room.code, 'Caio');
    await ana.repo.startVoting(room.id);
    const s = await ana.repo.fetchState(room.id);
    await ana.repo.castVote(room.id, s.options[0].id, 'yes');
    await caio.repo.castVote(room.id, s.options[1].id, 'yes');
    await ana.repo.finishVoting(room.id);
    await caio.repo.finishVoting(room.id);
    const r = (await caio.repo.fetchState(room.id)).result!;
    expect(r.winner_option_id).toBeNull();
  });

  it('convite por link: prévia sem login, entrada, reuso do mesmo link e limites', async () => {
    const host = await signedIn();
    const room = await host.repo.createRoom({ itemType: 'food', displayName: 'Ana', options, maxParticipants: 2 });
    const token = await host.repo.createInvite(room.id);
    expect(token).toMatch(/^[A-Za-z0-9_-]{24,64}$/);
    expect(await host.repo.createInvite(room.id)).toBe(token); // o mesmo link serve a todos

    // Prévia funciona sem sessão nenhuma (página do navegador antes de entrar).
    const anonymousPage = roomsRepository(device());
    const preview = await anonymousPage.invitePreview(token);
    expect(preview).toMatchObject({ room_code: room.code, item_type: 'food', participants: 1, max_participants: 2 });
    expect(await anonymousPage.invitePreview('naoexiste-naoexiste-naoexiste')).toBeNull();

    const guest = await signedIn();
    const joined = await guest.repo.joinByInvite(token, 'Bia');
    expect(joined.id).toBe(room.id);
    await guest.repo.joinByInvite(token, 'Bia'); // reentrada não gasta uso nem vaga

    const third = await signedIn();
    await expect(third.repo.joinByInvite(token, 'Caio')).rejects.toThrow('room_full');
    await expect(third.repo.joinByInvite('token-invalido-token-invalido', 'Caio')).rejects.toThrow('invite_invalid');

    // Quem não é da sala não vê os convites dela.
    const outsider = await third.client.from('room_invites').select('token').eq('room_id', room.id);
    expect(outsider.data).toEqual([]);
  });

  it('Modo festa: andamento conta quem terminou sem revelar votos', async () => {
    const ana = await signedIn();
    const caio = await signedIn();
    const intruso = await signedIn();
    const room = await ana.repo.createRoom({ itemType: 'food', displayName: 'Ana', options, maxParticipants: 4 });
    await caio.repo.joinRoom(room.code, 'Caio');
    expect(await ana.repo.progress(room.id)).toEqual({ participants: 2, finished: 0, duel_votes: 0 });
    await ana.repo.startVoting(room.id);
    await ana.repo.finishVoting(room.id);
    expect(await caio.repo.progress(room.id)).toEqual({ participants: 2, finished: 1, duel_votes: 0 });
    // Quem não está na sala não vê o andamento.
    await expect(intruso.repo.progress(room.id)).rejects.toThrow();
  });
});

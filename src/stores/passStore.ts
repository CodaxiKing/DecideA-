import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { computeGroupResult, type GroupResult, type Vote } from '../features/pass/engine';

export type PassKind = 'food' | 'movie' | 'activity';

export interface PassSession {
  kind: PassKind;
  people: string[];
  optionIds: string[];
  /** Quem está votando agora (índice em people). */
  current: number;
  /** Votos de cada pessoa, na mesma ordem de people. Nunca mostrados antes do fim. */
  votes: Record<string, Vote>[];
  /** Vetos por pessoa permitidos e os vetos de cada uma (secretos até o fim). */
  vetoesPerPerson: number;
  vetoes: string[][];
  phase: 'voting' | 'handoff' | 'done';
  result?: GroupResult;
  startedAt: string;
}

interface PassState {
  session?: PassSession;
  start: (kind: PassKind, people: string[], optionIds: string[], vetoesPerPerson?: number) => void;
  veto: (optionId: string) => boolean;
  vote: (optionId: string, vote: Vote) => void;
  /** Fecha a vez da pessoa atual: passa o celular ou calcula o resultado. */
  finishTurn: () => void;
  /** A próxima pessoa confirmou que está com o celular. */
  beginTurn: () => void;
  /** Recomeça a pessoa atual do zero (por exemplo, se o app fechou no meio). */
  restartTurn: () => void;
  clear: () => void;
}

export const MAX_PASS_PEOPLE = 8;

export const usePassStore = create<PassState>()(
  persist(
    (set, get) => ({
      session: undefined,
      start: (kind, people, optionIds, vetoesPerPerson = 0) =>
        set({
          session: {
            kind,
            people,
            optionIds,
            current: 0,
            votes: people.map(() => ({})),
            vetoesPerPerson,
            vetoes: people.map(() => []),
            phase: 'voting',
            startedAt: new Date().toISOString(),
          },
        }),
      vote: (optionId, vote) => {
        const s = get().session;
        if (!s || s.phase !== 'voting') return;
        const votes = s.votes.map((v, i) => (i === s.current ? { ...v, [optionId]: vote } : v));
        set({ session: { ...s, votes } });
      },
      veto: (optionId) => {
        const s = get().session;
        if (!s || s.phase !== 'voting') return false;
        const mine = s.vetoes?.[s.current] ?? [];
        if (mine.includes(optionId)) return true;
        if (mine.length >= (s.vetoesPerPerson ?? 0)) return false;
        const vetoes = (s.vetoes ?? s.people.map(() => [])).map((v, i) => (i === s.current ? [...v, optionId] : v));
        set({ session: { ...s, vetoes } });
        return true;
      },
      finishTurn: () => {
        const s = get().session;
        if (!s || s.phase !== 'voting') return;
        if (s.current < s.people.length - 1) {
          set({ session: { ...s, current: s.current + 1, phase: 'handoff' } });
        } else {
          const vetoed = [...new Set((s.vetoes ?? []).flat())];
          set({ session: { ...s, phase: 'done', result: computeGroupResult(s.optionIds, s.votes, undefined, vetoed) } });
        }
      },
      beginTurn: () => {
        const s = get().session;
        if (s?.phase === 'handoff') set({ session: { ...s, phase: 'voting' } });
      },
      restartTurn: () => {
        const s = get().session;
        if (!s || s.phase !== 'voting') return;
        set({
          session: {
            ...s,
            votes: s.votes.map((v, i) => (i === s.current ? {} : v)),
            vetoes: (s.vetoes ?? s.people.map(() => [])).map((v, i) => (i === s.current ? [] : v)),
          },
        });
      },
      clear: () => set({ session: undefined }),
    }),
    { name: 'decideai.pass', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

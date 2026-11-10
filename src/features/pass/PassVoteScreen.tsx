import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { SwipeDeck, type DeckItem, type DeckVote } from '../../components/swipe/SwipeDeck';
import { EmptyState, Screen } from '../../components/ui';
import { usePassStore } from '../../stores/passStore';
import { optionToDeckItem } from './options';

export function PassVoteScreen() {
  const router = useRouter();
  const session = usePassStore((s) => s.session);
  const vote = usePassStore((s) => s.vote);
  const finishTurn = usePassStore((s) => s.finishTurn);
  const restartTurn = usePassStore((s) => s.restartTurn);
  const veto = usePassStore((s) => s.veto);
  const restarted = useRef(false);

  // Se o app fechou no meio da vez de alguém, essa pessoa recomeça do zero.
  useEffect(() => {
    if (!restarted.current && session?.phase === 'voting') {
      restarted.current = true;
      restartTurn();
    }
  }, [session?.phase, restartTurn]);

  const items = useMemo<DeckItem[]>(
    () =>
      session ? session.optionIds.flatMap((id, i) => optionToDeckItem(session.kind, id, i) ?? []) : [],
    [session?.kind, session?.optionIds], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onVote = useCallback((item: DeckItem, v: DeckVote) => vote(item.id, v), [vote]);
  const onEnd = useCallback(() => {
    finishTurn();
    const next = usePassStore.getState().session;
    router.replace(next?.phase === 'done' ? '/passa/resultado' : '/passa/troca');
  }, [finishTurn, router]);

  if (!session || session.phase !== 'voting') {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Nenhuma votação em andamento" message="Volte e comece uma nova." />
      </Screen>
    );
  }

  const me = session.people[session.current];
  const others = session.people.filter((_, i) => i !== session.current);
  const note = others.length === 1 ? `${others[0]}, não olhe` : 'Os outros, não olhem';

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: `Vez de ${me}`, gestureEnabled: false }} />
      <SwipeDeck
        key={`${session.current}-${session.startedAt}`}
        items={items}
        onVote={onVote}
        onEnd={onEnd}
        label={(pos, total) => `${me} · opção ${Math.min(pos, total)} de ${total}`}
        note={note}
        cardHeight={session.vetoesPerPerson ? 320 : 360}
        veto={
          session.vetoesPerPerson
            ? { left: session.vetoesPerPerson - (session.vetoes?.[session.current]?.length ?? 0), onVeto: (item) => veto(item.id) }
            : undefined
        }
      />
    </Screen>
  );
}

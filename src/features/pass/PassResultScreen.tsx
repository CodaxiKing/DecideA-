import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { AppButton, AppCard, AppText, DecisionResultCard, EmptyState, Screen, ShareableResult } from '../../components/ui';
import { useHistoryStore } from '../../stores/historyStore';
import { usePassStore } from '../../stores/passStore';
import { spacing } from '../../theme/tokens';
import { itemInfo } from '../catalog/items';
import { optionTitle } from './options';

export function PassResultScreen() {
  const router = useRouter();
  const session = usePassStore((s) => s.session);
  const clear = usePassStore((s) => s.clear);
  const logged = useRef(false);
  const result = session?.result;

  useEffect(() => {
    if (logged.current || !session || !result?.winnerId) return;
    logged.current = true;
    useHistoryStore.getState().addEntry({
      kind: session.kind,
      title: optionTitle(session.kind, result.winnerId),
      source: `Passa o celular com ${session.people.length} pessoas`,
      refId: result.winnerId,
    });
  }, [session, result]);

  if (!session || session.phase !== 'done' || !result) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Nenhum resultado" message="Volte e comece uma votação." />
      </Screen>
    );
  }

  const people = session.people.length;
  const winner = result.winnerId;
  const title = winner ? optionTitle(session.kind, winner) : '';
  const info = winner ? itemInfo(session.kind, winner) : undefined;
  const image = info?.image;
  const caption = !winner
    ? ''
    : result.unanimous
      ? `Todo mundo quis. ${people} de ${people} votos.`
      : result.tiedIds.length
        ? `Empate entre ${result.tiedIds.length} opções, resolvido no sorteio.`
        : `A opção mais querida entre ${people} pessoas.`;

  const again = () => {
    clear();
    router.replace('/passa');
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Resultado', gestureEnabled: false }} />
      {winner ? (
        <ShareableResult fallbackText={`Decidimos no DecideAí: ${title}!`}>
          <DecisionResultCard eyebrow="Vocês decidiram" title={title} caption={caption} image={image} />
        </ShareableResult>
      ) : (
        <EmptyState title="Ninguém quis nada" message="Todos disseram não a todas as opções. Que tal outra rodada?" />
      )}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title3">Como ficou</AppText>
        {result.ranking.map((t, i) => (
          <AppCard
            key={t.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12 }}
            accessible
            accessibilityLabel={`${i + 1}º ${optionTitle(session.kind, t.id)}: ${t.yes} quero, ${t.maybe} talvez, ${t.no} não`}
          >
            <AppText variant="bodyStrong" style={{ width: 24 }}>
              {i + 1}
            </AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{optionTitle(session.kind, t.id)}</AppText>
              <AppText variant="small" color="textMuted">
                {t.vetoed ? 'Vetada · ' : ''}
                {t.yes} quero · {t.maybe} talvez · {t.no} não
              </AppText>
            </View>
          </AppCard>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        {info ? <AppButton label="Ver detalhes" onPress={() => router.push(info.href)} fullWidth /> : null}
        <AppButton label="Nova votação" variant="ghost" onPress={again} fullWidth />
      </View>
    </Screen>
  );
}

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppBadge, AppButton, AppText, DecisionResultCard, EmptyState, Screen, ShareableResult } from '../../components/ui';
import { usePreferenceSignals } from '../../stores/preferenceSignalsStore';
import { spacing } from '../../theme/tokens';
import { activityById, formatMinutes, moodLabels } from './catalog';
import { drawActivity } from './drawActivity';

/** Resultado do sorteio e página de uma atividade (`/fazer/[id]` usa a mesma tela). */
export function ActivityResultScreen({ detail = false }: { detail?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const a = activityById(id);

  if (!a) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Atividade não encontrada" message="Ela pode ter saído do catálogo." />
      </Screen>
    );
  }

  const tags = [formatMinutes(a.minutes), ...a.tags];

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: '' }} />
      <ShareableResult fallbackText={`Que tal ${a.name}? Decidido no DecideAí.`}>
        <DecisionResultCard eyebrow={detail ? 'Atividade' : 'Que tal'} title={a.name} image={a.image}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {tags.map((t) => (
              <View key={t} style={{ height: 28, paddingHorizontal: 10, borderRadius: 14, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <AppText variant="label" color="onPrimary">
                  {t}
                </AppText>
              </View>
            ))}
          </View>
        </DecisionResultCard>
      </ShareableResult>
      <AppText>{a.description}</AppText>
      {detail ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {a.moods.map((m) => (
            <AppBadge key={m} label={moodLabels[m]} />
          ))}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <AppButton
            label="Vamos nessa"
            onPress={() => {
              usePreferenceSignals.getState().record('activity', a.id, 'accept');
              router.dismissTo('/');
            }}
            fullWidth
          />
          <AppButton
            label="Sugerir outra"
            variant="ghost"
            onPress={() => {
              const next = drawActivity(true);
              if (next) router.replace({ pathname: '/fazer/resultado', params: { id: next.id } });
            }}
            fullWidth
          />
        </View>
      )}
    </Screen>
  );
}

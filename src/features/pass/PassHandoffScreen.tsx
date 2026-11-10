import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppButton, AppText, EmptyState, Screen } from '../../components/ui';
import { usePassStore } from '../../stores/passStore';
import { spacing } from '../../theme/tokens';

export function PassHandoffScreen() {
  const router = useRouter();
  const session = usePassStore((s) => s.session);
  const beginTurn = usePassStore((s) => s.beginTurn);

  if (!session || session.phase !== 'handoff') {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Nenhuma votação em andamento" message="Volte e comece uma nova." />
      </Screen>
    );
  }

  const next = session.people[session.current];
  const done = session.people.slice(0, session.current);
  const doneText = done.length === 1 ? `${done[0]} já votou.` : `${done.slice(0, -1).join(', ')} e ${done[done.length - 1]} já votaram.`;

  return (
    <Screen scroll={false} edges={['bottom']} contentStyle={{ justifyContent: 'center', gap: spacing.lg }}>
      <Stack.Screen options={{ title: '', gestureEnabled: false }} />
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3C9EC', alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="title1" style={{ color: '#1B1036' }}>
          {next[0]?.toUpperCase()}
        </AppText>
      </View>
      <AppText variant="display">Passe para {next}</AppText>
      <AppText>{doneText} Os votos ficam escondidos até o fim.</AppText>
      <AppButton
        label={`Sou ${next}, começar`}
        onPress={() => {
          beginTurn();
          router.replace('/passa/votar');
        }}
        fullWidth
      />
    </Screen>
  );
}

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { AppButton, AppText, EmptyState, Screen } from '../../components/ui';
import { useAuth } from '../../services/auth';
import { spacing } from '../../theme/tokens';
import { roomErrorMessage } from '../rooms/types';
import { socialRepo, useInvalidateSocial } from './useSocial';

/** Abre pelo link "Me adiciona no DecideAí": aceita a amizade na hora. */
export function FriendInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { registered } = useAuth();
  const invalidate = useInvalidateSocial();
  const [done, setDone] = useState<string>();
  const [error, setError] = useState<string>();

  const accept = async () => {
    try {
      const name = await socialRepo().acceptFriendInvite(token!);
      setDone(name);
      invalidate();
    } catch (e) {
      setError(roomErrorMessage(e));
    }
  };

  return (
    <Screen scroll={false} edges={['bottom']} contentStyle={{ justifyContent: 'center', gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Convite de amizade' }} />
      {!registered ? (
        <EmptyState
          title="Crie sua conta para aceitar"
          message="Amigos precisam de conta. Depois de entrar, abra o link de novo."
          action={<AppButton label="Entrar ou criar conta" onPress={() => router.push('/conta/entrar')} />}
        />
      ) : done ? (
        <EmptyState title={`Você e ${done} agora são amigos`} message="Chame para decidir quando quiser." action={<AppButton label="Ver amigos" onPress={() => router.replace('/amigos')} />} />
      ) : (
        <>
          <AppText variant="title1">Aceitar o convite de amizade?</AppText>
          {error ? (
            <AppText color="danger" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <AppButton label="Aceitar" onPress={accept} fullWidth />
        </>
      )}
    </Screen>
  );
}

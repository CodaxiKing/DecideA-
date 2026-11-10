import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { AppButton, AppInput, AppText, Screen } from '../../components/ui';
import { ensureSession, isBackendConfigured } from '../../services/supabase';
import { useProfileStore } from '../../stores/profileStore';
import { spacing, typography } from '../../theme/tokens';
import { BackendNotice } from './BackendNotice';
import { normalizeRoomCode, roomErrorMessage, ROOM_CODE_PATTERN } from './types';
import { roomsRepo } from './useRoom';

export function JoinRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ codigo?: string }>();
  const savedName = useProfileStore((s) => s.displayName);
  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const [code, setCode] = useState(normalizeRoomCode(params.codigo ?? ''));
  const [name, setName] = useState(savedName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const join = async () => {
    if (!ROOM_CODE_PATTERN.test(code)) {
      setError('O código tem 6 letras e números, como K7M2QX.');
      return;
    }
    if (!name.trim()) {
      setError('Diga como os outros vão te ver na sala.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await ensureSession();
      setDisplayName(name.trim());
      const room = await roomsRepo().joinRoom(code, name.trim());
      router.replace({ pathname: '/sala/[id]', params: { id: room.id } });
    } catch (e) {
      setError(roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Entrar na sala' }} />
      <AppText variant="title1">Tenho um código</AppText>
      {!isBackendConfigured ? (
        <BackendNotice />
      ) : (
        <>
          <AppInput
            label="Código da sala"
            value={code}
            onChangeText={(t) => setCode(normalizeRoomCode(t))}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            placeholder="K7M2QX"
            style={{ ...typography.title2, letterSpacing: 4, height: 64 }}
          />
          <AppInput label="Seu nome na sala" value={name} onChangeText={setName} maxLength={20} placeholder="Ex.: Caio" />
          {error ? (
            <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <AppButton label={busy ? 'Entrando…' : 'Entrar'} onPress={join} disabled={busy} fullWidth />
        </>
      )}
    </Screen>
  );
}

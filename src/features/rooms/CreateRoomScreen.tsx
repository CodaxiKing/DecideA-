import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppInput, AppText, FilterChip, Screen } from '../../components/ui';
import { ensureSession, isBackendConfigured } from '../../services/supabase';
import { useProfileStore } from '../../stores/profileStore';
import { spacing } from '../../theme/tokens';
import { BackendNotice } from './BackendNotice';
import { buildRoomOptions } from './roomOptions';
import { roomErrorMessage, type RoomItemType } from './types';
import { usePremium } from '../premium/usePremium';
import { roomsRepo } from './useRoom';

export function CreateRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: RoomItemType }>();
  const savedName = useProfileStore((s) => s.displayName);
  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const { limits } = usePremium();
  const [itemType, setItemType] = useState<RoomItemType>(params.kind === 'movie' ? 'movie' : 'food');
  const [name, setName] = useState(savedName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const create = async () => {
    if (!name.trim()) {
      setError('Diga como os outros vão te ver na sala.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await ensureSession();
      setDisplayName(name.trim());
      const room = await roomsRepo().createRoom({
        itemType,
        displayName: name.trim(),
        options: buildRoomOptions(itemType),
        maxParticipants: limits.roomSize,
      });
      router.replace({ pathname: '/sala/[id]', params: { id: room.id } });
    } catch (e) {
      setError(roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Criar sala' }} />
      <AppText variant="title1">Decidir em grupo</AppText>
      <AppText color="textMuted">Cada pessoa vota no próprio celular. O resultado aparece para todos ao mesmo tempo.</AppText>
      {!isBackendConfigured ? (
        <BackendNotice />
      ) : (
        <>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="smallStrong">O que vão decidir?</AppText>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
              <FilterChip label="Comida" selected={itemType === 'food'} onPress={() => setItemType('food')} />
              <FilterChip label="Filme" selected={itemType === 'movie'} onPress={() => setItemType('movie')} />
            </View>
            <AppText variant="small" color="textMuted">
              {itemType === 'food'
                ? '8 pratos das categorias e filtros que você escolheu no O Que Comer?'
                : '8 títulos da sua lista de "quero", ou do catálogo com os seus filtros.'}
            </AppText>
          </View>
          <AppInput label="Seu nome na sala" value={name} onChangeText={setName} maxLength={20} placeholder="Ex.: Ana" />
          <AppText variant="small" color="textMuted">
            Até {limits.roomSize} pessoas. A sala expira em {limits.roomMinutes >= 120 ? '2 horas' : `${limits.roomMinutes} minutos`}.
          </AppText>
          {error ? (
            <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <AppButton label={busy ? 'Criando…' : 'Criar sala'} onPress={create} disabled={busy} fullWidth />
          <AppButton label="Tenho um código" variant="ghost" onPress={() => router.replace('/sala/entrar')} fullWidth />
        </>
      )}
    </Screen>
  );
}

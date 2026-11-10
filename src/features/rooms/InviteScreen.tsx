import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppCard, AppInput, AppText, BrandMark, EmptyState, LoadingState, Screen } from '../../components/ui';
import { ensureSession, isBackendConfigured } from '../../services/supabase';
import { useProfileStore } from '../../stores/profileStore';
import { spacing } from '../../theme/tokens';
import { itemKindLabels } from '../catalog/items';
import { BackendNotice } from './BackendNotice';
import { roomErrorMessage } from './types';
import { roomsRepo, useRoomsRepository } from './useRoom';

/**
 * Página do convite: abre pelo link (no app ou no navegador, sem instalar nada),
 * mostra o que é a sala e põe a pessoa para votar.
 */
export function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const repo = useRoomsRepository();
  const savedName = useProfileStore((s) => s.displayName);
  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const [name, setName] = useState(savedName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const preview = useQuery({
    queryKey: ['invite', token],
    queryFn: () => repo!.invitePreview(token!),
    enabled: !!repo && !!token,
  });

  const join = async () => {
    if (!name.trim()) {
      setError('Diga como os outros vão te ver.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await ensureSession();
      setDisplayName(name.trim());
      const room = await roomsRepo().joinByInvite(token!, name.trim());
      router.replace({ pathname: '/sala/[id]', params: { id: room.id } });
    } catch (e) {
      setError(roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const [openedAt] = useState(() => Date.now());
  const p = preview.data;
  const expired = p && (p.status === 'closed' || new Date(p.expires_at).getTime() < openedAt);

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
      <Stack.Screen options={{ title: 'Convite' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <BrandMark size={28} />
        <AppText variant="title3">DecideAí</AppText>
      </View>
      {!isBackendConfigured ? (
        <BackendNotice />
      ) : preview.isLoading ? (
        <LoadingState message="Abrindo o convite…" />
      ) : !p ? (
        <EmptyState title="Convite não encontrado" message="O link pode estar incompleto. Peça um novo para quem te convidou." />
      ) : expired ? (
        <EmptyState title="Esse convite expirou" message="A votação já acabou ou o tempo da sala passou. Peça um link novo." />
      ) : p.status !== 'lobby' ? (
        <EmptyState title="A votação já começou" message="Peça para quem te convidou criar outra sala." />
      ) : (
        <>
          <AppText variant="title1">{p.decision_mode === 'match' ? 'Te chamaram para um Match' : 'Te chamaram para decidir juntos'}</AppText>
          <AppCard>
            <AppText variant="bodyStrong">
              {itemKindLabels[p.item_type as 'food' | 'movie' | 'activity'] ?? 'Decisão'} ·{' '}
              {p.decision_mode === 'match' ? 'Match a dois' : 'Votação em grupo'}
            </AppText>
            <AppText variant="small" color="textMuted">
              {p.participants} de {p.max_participants} pessoas já estão na sala. Você vota sem criar conta e os votos ficam em segredo.
            </AppText>
          </AppCard>
          <AppInput label="Seu nome" value={name} onChangeText={setName} maxLength={20} placeholder="Ex.: Caio" />
          {error ? (
            <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <AppButton label={busy ? 'Entrando…' : 'Entrar e votar'} onPress={join} disabled={busy} fullWidth />
        </>
      )}
    </Screen>
  );
}

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppInput, AppText, FilterChip, Screen } from '../../components/ui';
import { ensureSession, isBackendConfigured } from '../../services/supabase';
import { useProfileStore } from '../../stores/profileStore';
import { spacing } from '../../theme/tokens';
import { usePremium } from '../premium/usePremium';
import { BackendNotice } from './BackendNotice';
import { buildRoomOptions } from './roomOptions';
import { roomErrorMessage, type RoomItemType } from './types';
import { roomsRepo } from './useRoom';

type Mode = 'vote' | 'match';

const kindHints: Record<'food' | 'movie' | 'activity', string> = {
  food: '8 pratos das categorias e filtros que você escolheu no O Que Comer?',
  movie: '8 títulos da sua lista de "quero", ou do catálogo com os seus filtros.',
  activity: '8 atividades com os filtros do O Que Fazer?',
};

export function CreateRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: RoomItemType; mode?: Mode }>();
  const savedName = useProfileStore((s) => s.displayName);
  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const { limits } = usePremium();
  const [itemType, setItemType] = useState<'food' | 'movie' | 'activity'>(
    params.kind === 'movie' || params.kind === 'activity' ? params.kind : 'food',
  );
  const [mode, setMode] = useState<Mode>(params.mode === 'match' ? 'match' : 'vote');
  const [vetoes, setVetoes] = useState(mode === 'match' ? 1 : 0);
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
        maxParticipants: mode === 'match' ? 2 : limits.roomSize,
        mode,
        vetoes,
      });
      router.replace({ pathname: '/sala/[id]', params: { id: room.id } });
    } catch (e) {
      setError(roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const isMatch = mode === 'match';

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: isMatch ? 'Match a dois' : 'Criar sala' }} />
      <AppText variant="title1">{isMatch ? 'Match a dois' : 'Decidir em grupo'}</AppText>
      <AppText color="textMuted">
        {isMatch
          ? 'Cada um vota no próprio celular, em segredo. Só vale o que os dois quiserem.'
          : 'Cada pessoa vota no próprio celular. O resultado aparece para todos ao mesmo tempo.'}
      </AppText>
      {!isBackendConfigured ? (
        <BackendNotice />
      ) : (
        <>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="smallStrong">Como decidir?</AppText>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <FilterChip label="Votação em grupo" selected={!isMatch} onPress={() => setMode('vote')} />
              <FilterChip label="Match a dois" selected={isMatch} onPress={() => setMode('match')} />
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="smallStrong">O que vão decidir?</AppText>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <FilterChip label="Comida" selected={itemType === 'food'} onPress={() => setItemType('food')} />
              <FilterChip label="Filme" selected={itemType === 'movie'} onPress={() => setItemType('movie')} />
              <FilterChip label="Atividade" selected={itemType === 'activity'} onPress={() => setItemType('activity')} />
            </View>
            <AppText variant="small" color="textMuted">
              {kindHints[itemType]}
            </AppText>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="smallStrong">Vetos por pessoa</AppText>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
              {[0, 1, 2].map((n) => (
                <FilterChip key={n} label={String(n)} selected={vetoes === n} onPress={() => setVetoes(n)} />
              ))}
            </View>
            <AppText variant="small" color="textMuted">
              Um veto tira a opção da rodada para todo mundo, mesmo que os outros queiram.
            </AppText>
          </View>
          <AppInput label="Seu nome na sala" value={name} onChangeText={setName} maxLength={20} placeholder="Ex.: Ana" />
          <AppText variant="small" color="textMuted">
            {isMatch ? 'Só vocês dois.' : `Até ${limits.roomSize} pessoas.`} A sala expira em{' '}
            {limits.roomMinutes >= 120 ? '2 horas' : `${limits.roomMinutes} minutos`}.
          </AppText>
          {error ? (
            <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <AppButton label={busy ? 'Criando…' : isMatch ? 'Criar Match' : 'Criar sala'} onPress={create} disabled={busy} fullWidth />
          <AppButton label="Tenho um código" variant="ghost" onPress={() => router.replace('/sala/entrar')} fullWidth />
        </>
      )}
    </Screen>
  );
}

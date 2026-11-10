import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton, AppText, FilterChip, Icon, Screen } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import { ensureSession } from '../../services/supabase';
import { useProfileStore } from '../../stores/profileStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { usePremium } from '../premium/usePremium';
import { buildRoomOptions } from '../rooms/roomOptions';
import { roomErrorMessage } from '../rooms/types';
import { roomsRepo } from '../rooms/useRoom';
import { personName, socialRepo, useSocial } from './useSocial';

type Mode = 'battle' | 'match' | 'ranking' | 'wheel';

const modes: { v: Mode; title: string; text: string }[] = [
  { v: 'battle', title: 'Batalha', text: 'Votem juntos em cada duelo' },
  { v: 'match', title: 'Match', text: 'Só aparece o que agrada a todos' },
  { v: 'ranking', title: 'Ranking', text: 'Cada um ordena suas favoritas' },
  { v: 'wheel', title: 'Roleta ao vivo', text: 'Todos veem o mesmo giro' },
];

/** Quantas opções cada modo usa. */
const optionCount: Record<Mode, number> = { battle: 4, match: 8, ranking: 4, wheel: 6 };

export function InviteFriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ ids?: string; group?: string }>();
  const ids = (params.ids ?? '').split(',').filter(Boolean);
  const { friends } = useSocial();
  const { limits } = usePremium();
  const displayName = useProfileStore((s) => s.displayName);
  const [mode, setMode] = useState<Mode>(ids.length === 1 ? 'match' : 'battle');
  const [kind, setKind] = useState<'food' | 'movie' | 'activity'>('food');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const people = (friends.data ?? []).filter((f) => ids.includes(f.user_id));
  const onlineNames = people.filter((p) => p.presence === 'online').map(personName);
  const matchTooMany = mode === 'match' && ids.length > 1;

  const send = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await ensureSession();
      const options = buildRoomOptions(kind).slice(0, optionCount[mode]);
      const room = await roomsRepo().createRoom({
        itemType: kind,
        displayName: displayName || 'Eu',
        options,
        maxParticipants: mode === 'match' ? 2 : Math.max(limits.roomSize, ids.length + 1),
        mode,
      });
      await socialRepo().inviteToRoom(room.id, ids);
      router.replace({ pathname: '/sala/[id]', params: { id: room.id } });
    } catch (e) {
      setError(roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Convidar para decidir' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flexDirection: 'row' }}>
          {people.slice(0, 4).map((p, i) => (
            <View key={p.user_id} style={{ marginLeft: i ? -12 : 0 }}>
              <Avatar name={personName(p)} index={i} presence={p.presence} />
            </View>
          ))}
        </View>
        <AppText variant="small" color="textMuted" style={{ flex: 1 }}>
          {onlineNames.length ? `${onlineNames.join(' e ')} ${onlineNames.length === 1 ? 'está' : 'estão'} online` : 'Eles recebem o convite no app.'}
        </AppText>
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">Modo</AppText>
        <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
          {modes.map((m) => {
            const on = mode === m.v;
            return (
              <Pressable
                key={m.v}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${m.title}. ${m.text}`}
                onPress={() => setMode(m.v)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  minHeight: 64,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.lg,
                  backgroundColor: on ? colors.primary : colors.surface,
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" color={on ? 'onPrimary' : 'text'}>
                    {m.title}
                  </AppText>
                  <AppText variant="small" color={on ? 'onPrimary' : 'textMuted'}>
                    {m.text}
                  </AppText>
                </View>
                {on ? <Icon name="check" color={colors.onPrimary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">Sobre o quê?</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <FilterChip label="Comida" selected={kind === 'food'} onPress={() => setKind('food')} />
          <FilterChip label="Filme" selected={kind === 'movie'} onPress={() => setKind('movie')} />
          <FilterChip label="Atividade" selected={kind === 'activity'} onPress={() => setKind('activity')} />
        </View>
      </View>
      {matchTooMany ? (
        <AppText variant="small" color="danger">
          O Match é a dois. Para mais pessoas, use Batalha ou Ranking.
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
      <AppButton label={busy ? 'Enviando…' : 'Enviar convite'} onPress={send} disabled={busy || ids.length === 0 || matchTooMany} fullWidth />
    </Screen>
  );
}

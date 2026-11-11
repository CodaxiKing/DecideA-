import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText, BrandMark, EmptyState, LoadingState } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing, wheelColors } from '../../theme/tokens';
import { itemInfo } from '../catalog/items';
import { inviteLink } from '../rooms/inviteLink';
import { roomErrorMessage } from '../rooms/types';
import { roomsRepo, useRoomState } from '../rooms/useRoom';

/**
 * Modo festa: tela grande (TV ou notebook) com o código, o QR Code e o andamento.
 * Os convidados votam pelo próprio celular, sem instalar o app.
 */
export function PartyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const { data: state, error, isLoading } = useRoomState(id);
  const wide = width > height;
  const invite = useQuery({ queryKey: ['invite-token', id], queryFn: () => roomsRepo().createInvite(id!), enabled: !!id && state?.room.status === 'lobby', staleTime: Infinity });
  const progress = useQuery({ queryKey: ['room', id, 'progress'], queryFn: () => roomsRepo().progress(id!), enabled: !!id, refetchInterval: 2000 });

  if (isLoading) return <LoadingState message="Montando a festa…" />;
  if (error || !state) return <EmptyState title="Não deu para abrir a festa" message={roomErrorMessage(error)} />;

  const { room, options, result } = state;
  const p = progress.data;
  const title = (optionId: string) => options.find((o) => o.id === optionId)?.title ?? '';
  const image = (optionId: string) => {
    const o = options.find((x) => x.id === optionId);
    return o ? itemInfo(room.item_type, o.ref_id)?.image : undefined;
  };
  const big = Math.min(width, height);
  const st = room.battle_state;

  let center: React.ReactNode;
  if (room.status === 'closed' && result?.winner_option_id) {
    center = (
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <AppText variant="title2">A festa decidiu</AppText>
        <AppText variant="display" style={{ fontSize: big * 0.09, lineHeight: big * 0.1, textAlign: 'center' }}>
          {title(result.winner_option_id)}
        </AppText>
      </View>
    );
  } else if (room.status === 'voting' && room.decision_mode === 'battle' && st) {
    const pair = [st.current[st.index], st.current[st.index + 1]];
    const alive = st.current.length - st.index + st.next.length;
    center = (
      <View style={{ gap: spacing.lg, flex: 1 }}>
        <AppText variant="title2" style={{ textAlign: 'center' }}>
          {alive <= 2 ? 'Grande final' : alive <= 4 ? 'Semifinal' : `Rodada ${st.round}`} · {p?.duel_votes ?? 0} de {p?.participants ?? 0} votaram
        </AppText>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: spacing.lg, flex: 1 }}>
          {pair.map((o, i) => (
            <View key={o} style={{ flex: 1, minHeight: 160, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: wheelColors[i * 2], justifyContent: 'flex-end', padding: spacing.xl }}>
              {image(o) ? <Image source={image(o)} resizeMode="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', backgroundColor: 'rgba(10,6,24,0.55)' }} />
              <AppText variant="display" style={{ color: '#FFFFFF', fontSize: big * 0.06, lineHeight: big * 0.065 }}>
                {title(o)}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    );
  } else if (room.status === 'voting') {
    center = (
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <AppText variant="display" style={{ fontSize: big * 0.12, lineHeight: big * 0.13 }}>
          {p?.finished ?? 0}/{p?.participants ?? 0}
        </AppText>
        <AppText variant="title2">já votaram</AppText>
      </View>
    );
  } else {
    const link = invite.data ? inviteLink(invite.data) : undefined;
    center = (
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <AppText variant="title2">Entre com o código</AppText>
        <AppText variant="display" style={{ fontSize: big * 0.1, lineHeight: big * 0.11, letterSpacing: 6 }}>
          {room.code}
        </AppText>
        {link ? (
          <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20 }}>
            <QRCode value={link} size={Math.min(260, big * 0.32)} color="#1B1036" backgroundColor="#FFFFFF" />
          </View>
        ) : null}
        <AppText color="textMuted">Votem pelo celular. O app não precisa estar instalado.</AppText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <BrandMark size={32} />
          <AppText variant="title2">DecideAí · Modo festa</AppText>
        </View>
        <AppText variant="title3" accessibilityLiveRegion="polite">
          {p?.participants ?? state.participants.filter((x) => !x.left_at).length} na festa
        </AppText>
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>{center}</View>
    </View>
  );
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Share, View } from 'react-native';

import { SwipeDeck, type DeckItem, type DeckVote } from '../../components/swipe/SwipeDeck';
import { AppButton, AppCard, AppText, DecisionResultCard, EmptyState, LoadingState, Screen, ShareableResult } from '../../components/ui';
import { useHistoryStore } from '../../stores/historyStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { itemInfo } from '../catalog/items';
import { hasWebInvites, inviteLink, inviteMessage } from './inviteLink';
import { GroupBattleView, LiveWheelView, RankingResultView, RankingView } from './ModeViews';
import { roomOptionToDeckItem } from './roomOptions';
import { isRoomExpired, roomErrorMessage, type RoomState } from './types';
import { roomsRepo, useRoomState } from './useRoom';

const avatarColors = ['#D3C4FF', '#F3C9EC', '#BFD6FF', '#BFEBE6'];

export function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, isLoading, refetch } = useRoomState(id);

  if (isLoading) {
    return (
      <Screen scroll={false} edges={[]}>
        <Stack.Screen options={{ title: 'Sala' }} />
        <LoadingState message="Entrando na sala…" />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen scroll={false} edges={[]}>
        <Stack.Screen options={{ title: 'Sala' }} />
        <EmptyState
          title="Não deu para abrir a sala"
          message={roomErrorMessage(error)}
          action={<AppButton label="Tentar de novo" onPress={() => refetch()} />}
        />
      </Screen>
    );
  }
  return <RoomContent state={data} />;
}

function RoomContent({ state }: { state: RoomState }) {
  const { room, participants, me, result } = state;
  const isHost = room.host_id === me;
  const active = participants.filter((p) => !p.left_at);
  const mine = participants.find((p) => p.user_id === me);
  const expired = isRoomExpired(room);

  const mode = room.decision_mode;
  let body: React.ReactNode;
  if (mode === 'wheel' && (room.status === 'closed' || room.status === 'lobby') && !expired)
    body = (
      <>
        {room.status === 'lobby' ? <LobbyView state={state} isHost={isHost} /> : null}
        <LiveWheelView state={state} isHost={isHost} />
      </>
    );
  else if (room.status === 'closed' && result) body = mode === 'ranking' ? <RankingResultView state={state} /> : <ResultView state={state} />;
  else if (expired) body = <ExpiredView />;
  else if (room.status === 'lobby') body = <LobbyView state={state} isHost={isHost} />;
  else if (mode === 'battle') body = <GroupBattleView state={state} />;
  else if (mine?.finished_at) body = <WaitingView state={state} isHost={isHost} />;
  else if (mode === 'ranking') body = <RankingView state={state} />;
  else body = <VotingView state={state} />;

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: `Sala ${room.code}` }} />
      {body}
      {room.status !== 'closed' && !expired ? (
        <AppText variant="small" color="textMuted" style={{ textAlign: 'center' }}>
          {active.length} de {room.max_participants} pessoas
        </AppText>
      ) : null}
    </Screen>
  );
}

function People({ state }: { state: RoomState }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {state.participants
        .filter((p) => !p.left_at)
        .map((p, i) => (
          <View key={p.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: avatarColors[i % avatarColors.length], alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="bodyStrong" style={{ color: '#1B1036' }}>
                {p.display_name[0]?.toUpperCase()}
              </AppText>
            </View>
            <AppText variant="bodyStrong" style={{ flex: 1 }}>
              {p.display_name}
              {p.user_id === state.me ? ' (você)' : ''}
              {p.user_id === state.room.host_id ? ' · criou a sala' : ''}
            </AppText>
            {state.room.status === 'voting' ? (
              <AppText variant="small" color={p.finished_at ? 'primary' : 'textMuted'}>
                {p.finished_at ? 'Votou' : 'Votando…'}
              </AppText>
            ) : null}
          </View>
        ))}
      <View style={{ height: 1, backgroundColor: colors.surfaceStrong }} />
    </View>
  );
}

function LobbyView({ state, isHost }: { state: RoomState; isHost: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { room } = state;
  const invite = useQuery({ queryKey: ['invite-token', room.id], queryFn: () => roomsRepo().createInvite(room.id), staleTime: Infinity });
  const link = invite.data ? inviteLink(invite.data) : Linking.createURL('/sala/entrar', { queryParams: { codigo: room.code } });
  const isMatch = room.decision_mode === 'match';

  const start = async () => {
    setBusy(true);
    try {
      await roomsRepo().startVoting(room.id);
      await queryClient.invalidateQueries({ queryKey: ['room', room.id] });
    } catch (e) {
      Alert.alert('Não deu para começar', roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    try {
      await roomsRepo().leaveRoom(room.id);
    } catch {
      // Sair é melhor esforço: a sala expira sozinha.
    }
    router.dismissTo('/');
  };

  return (
    <>
      <View style={{ alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl }}>
        <AppText color="textMuted">Código da sala</AppText>
        <AppText variant="display" accessibilityLabel={`Código ${room.code.split('').join(' ')}`} style={{ letterSpacing: 4 }}>
          {room.code}
        </AppText>
        {invite.data ? (
          <View accessible accessibilityLabel="QR Code do convite" style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 16 }}>
            <QRCode value={link} size={168} color="#1B1036" backgroundColor="#FFFFFF" />
          </View>
        ) : null}
        <AppText variant="small" color="textMuted" style={{ textAlign: 'center' }}>
          {hasWebInvites ? 'Quem abrir o link vota pelo navegador, sem instalar nada.' : 'Quem tiver o app entra pelo link, QR Code ou código.'}
        </AppText>
        <AppButton
          label="Compartilhar convite"
          variant="ghost"
          size="sm"
          onPress={() => Share.share({ message: inviteMessage(link, room.code, isMatch) }).catch(() => {})}
        />
      </View>
      <AppText variant="title3">Quem já entrou</AppText>
      <People state={state} />
      {room.decision_mode === 'wheel' ? null : isHost ? (
        <AppButton
          label={busy ? 'Começando…' : 'Começar votação'}
          onPress={start}
          disabled={busy || state.participants.filter((p) => !p.left_at).length < 2}
          fullWidth
        />
      ) : (
        <AppText color="textMuted" style={{ textAlign: 'center' }}>
          Esperando quem criou a sala começar a votação.
        </AppText>
      )}
      {isHost && state.participants.filter((p) => !p.left_at).length < 2 ? (
        <AppText variant="small" color="textMuted" style={{ textAlign: 'center' }}>
          Chame pelo menos mais uma pessoa para começar.
        </AppText>
      ) : null}
      <AppButton label="Sair da sala" variant="ghost" size="sm" onPress={leave} fullWidth />
    </>
  );
}

function VotingView({ state }: { state: RoomState }) {
  const queryClient = useQueryClient();
  const { room, options } = state;
  const pending = useRef<Promise<unknown>[]>([]);
  const [sending, setSending] = useState(false);
  const [vetoesUsed, setVetoesUsed] = useState(state.myVetoes.length);
  const isMatch = room.decision_mode === 'match';
  const items = useMemo<DeckItem[]>(
    // Quem volta para a sala continua de onde parou.
    () => options.filter((o) => !state.myVotes[o.id]).map((o) => roomOptionToDeckItem(room.item_type, o)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options, room.item_type],
  );

  const onVote = useCallback(
    (item: DeckItem, v: DeckVote) => {
      pending.current.push(roomsRepo().castVote(room.id, item.id, v));
    },
    [room.id],
  );

  const onVeto = useCallback(
    (item: DeckItem) => {
      setVetoesUsed((n) => n + 1);
      pending.current.push(roomsRepo().castVeto(room.id, item.id));
    },
    [room.id],
  );

  const finish = useCallback(async () => {
    setSending(true);
    try {
      await Promise.all(pending.current);
      await roomsRepo().finishVoting(room.id);
      await queryClient.invalidateQueries({ queryKey: ['room', room.id] });
    } catch (e) {
      Alert.alert('Seus votos não foram enviados', roomErrorMessage(e));
    } finally {
      setSending(false);
    }
  }, [room.id, queryClient]);

  if (sending) return <LoadingState message="Enviando seus votos…" />;
  if (items.length === 0) {
    // Já tinha votado em tudo antes de cair a conexão: só falta confirmar.
    return (
      <View style={{ gap: spacing.md }}>
        <AppText variant="title2">Você já votou em todas as opções</AppText>
        <AppButton label="Enviar meus votos" onPress={finish} fullWidth />
      </View>
    );
  }

  return (
    <SwipeDeck
      items={items}
      onVote={onVote}
      onEnd={finish}
      label={(pos, total) => `Opção ${Math.min(pos + options.length - total, options.length)} de ${options.length}`}
      cardHeight={room.vetoes_per_person > 0 ? 300 : 340}
      allowMaybe={!isMatch}
      veto={room.vetoes_per_person > 0 ? { left: room.vetoes_per_person - vetoesUsed, onVeto } : undefined}
    />
  );
}

function WaitingView({ state, isHost }: { state: RoomState; isHost: boolean }) {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const remaining = state.participants.filter((p) => !p.left_at && !p.finished_at).length;
  const close = async () => {
    setBusy(true);
    try {
      await roomsRepo().closeRoom(state.room.id);
      await queryClient.invalidateQueries({ queryKey: ['room', state.room.id] });
    } catch (e) {
      Alert.alert('Não deu para encerrar', roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <AppText variant="title1">Votos enviados</AppText>
      <AppText color="textMuted">
        {remaining === 1 ? 'Falta 1 pessoa terminar.' : `Faltam ${remaining} pessoas terminarem.`} O resultado aparece aqui para todo
        mundo ao mesmo tempo.
      </AppText>
      <People state={state} />
      {isHost ? (
        <AppButton label={busy ? 'Encerrando…' : 'Encerrar com quem já votou'} variant="ghost" onPress={close} disabled={busy} fullWidth />
      ) : null}
    </>
  );
}

function ResultView({ state }: { state: RoomState }) {
  const router = useRouter();
  const { room, result, options } = state;
  const logged = useRef(false);
  const winner = options.find((o) => o.id === result?.winner_option_id);
  const isMatch = room.decision_mode === 'match';
  const isBattle = room.decision_mode === 'battle';

  useEffect(() => {
    if (logged.current || !winner || room.item_type === 'custom') return;
    logged.current = true;
    useHistoryStore.getState().addEntry({
      kind: room.item_type,
      title: winner.title,
      source: isMatch ? 'Match a dois' : `Sala com ${result?.voters ?? 0} pessoas`,
      refId: winner.ref_id,
    });
  }, [winner, room.item_type, result?.voters, isMatch]);

  if (!result) return null;
  const info = winner ? itemInfo(room.item_type, winner.ref_id) : undefined;
  const image = info?.image;
  const matches = result.tied_option_ids.length || 1;
  const caption = !winner
    ? ''
    : isMatch
      ? matches > 1
        ? `Vocês combinaram em ${matches} opções; o app sorteou uma.`
        : 'Os dois disseram quero.'
      : result.unanimous
      ? `Todo mundo quis. ${result.voters} de ${result.voters} votos.`
      : result.tied_option_ids.length
        ? `Empate entre ${result.tied_option_ids.length} opções, resolvido no sorteio.`
        : `A opção mais querida entre ${result.voters} pessoas.`;

  return (
    <>
      {winner ? (
        <ShareableResult fallbackText={`${isMatch ? 'Deu match' : 'Decidimos'} no DecideAí: ${winner.title}!`}>
          <DecisionResultCard
            eyebrow={isMatch ? 'Deu match!' : isBattle ? 'Venceu a batalha' : 'A sala decidiu'}
            title={winner.title}
            caption={isBattle ? `Depois de ${state.options.length - 1} duelos entre ${state.options.length} opções, com ${result.voters} pessoas.` : caption}
            image={image}
          />
        </ShareableResult>
      ) : isMatch ? (
        <EmptyState
          title="Sem match desta vez"
          message="Nenhuma opção agradou aos dois. Tentem uma nova rodada com outras opções ou filtros mais soltos."
          action={<AppButton label="Nova rodada" onPress={() => router.replace({ pathname: '/sala/criar', params: { kind: room.item_type, mode: 'match' } })} />}
        />
      ) : (
        <EmptyState title="Ninguém quis nada" message="Todos disseram não a todas as opções. Que tal criar outra sala?" />
      )}
      <View style={{ gap: spacing.sm, display: result.ranking.length ? 'flex' : 'none' }}>
        <AppText variant="title3">Como ficou</AppText>
        {result.ranking.map((r, i) => (
          <AppCard
            key={r.option_id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12 }}
            accessible
            accessibilityLabel={`${i + 1}º ${r.title}: ${r.yes} quero, ${r.maybe} talvez, ${r.no} não`}
          >
            <AppText variant="bodyStrong" style={{ width: 24 }}>
              {i + 1}
            </AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{r.title}</AppText>
              <AppText variant="small" color="textMuted">
                {r.vetoed ? 'Vetada · ' : ''}
                {r.yes} quero · {isMatch ? '' : `${r.maybe} talvez · `}
                {r.no} não
              </AppText>
            </View>
          </AppCard>
        ))}
      </View>
      {info ? <AppButton label="Ver detalhes" onPress={() => router.push(info.href)} fullWidth /> : null}
      <AppButton label="Voltar ao início" variant="ghost" onPress={() => router.dismissTo('/')} fullWidth />
    </>
  );
}

function ExpiredView() {
  const router = useRouter();
  return (
    <EmptyState
      title="Sala expirada"
      message="As salas do plano grátis duram 30 minutos. Crie outra para votar de novo."
      action={<AppButton label="Criar outra sala" onPress={() => router.replace('/sala/criar')} />}
    />
  );
}

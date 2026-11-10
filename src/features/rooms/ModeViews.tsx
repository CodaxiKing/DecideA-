import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppButton, AppCard, AppText, DecisionResultCard, IconButton, LoadingState, ShareableResult } from '../../components/ui';
import { SpinningWheel, type SpinningWheelHandle } from '../../components/wheel/SpinningWheel';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing, wheelColors } from '../../theme/tokens';
import { itemInfo } from '../catalog/items';
import { sectorSize } from '../wheel/spin';
import { roomErrorMessage, type RoomState } from './types';
import { roomsRepo } from './useRoom';

const optionTitle = (state: RoomState, id: string) => state.options.find((o) => o.id === id)?.title ?? '';
const optionImage = (state: RoomState, id: string) => {
  const o = state.options.find((x) => x.id === id);
  return o ? itemInfo(state.room.item_type, o.ref_id)?.image : undefined;
};

// ---------------------------------------------------------------------------
// Batalha em grupo
// ---------------------------------------------------------------------------
export function GroupBattleView({ state }: { state: RoomState }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const st = state.room.battle_state;
  const [votedDuel, setVotedDuel] = useState<number>();
  if (!st) return <LoadingState message="Preparando a batalha…" />;
  const pair = [st.current[st.index], st.current[st.index + 1]];
  const voted = votedDuel === st.duel;
  const totalDuels = Math.max(1, st.total - 1);
  const alive = st.current.length - st.index + st.next.length;
  const stage = alive <= 2 ? 'Grande final' : alive <= 4 ? 'Semifinal' : `Rodada ${st.round}`;

  const vote = async (optionId: string) => {
    setVotedDuel(st.duel);
    try {
      await roomsRepo().voteDuel(state.room.id, st.duel, optionId);
      await queryClient.invalidateQueries({ queryKey: ['room', state.room.id] });
    } catch (e) {
      setVotedDuel(undefined);
      Alert.alert('Seu voto não foi', roomErrorMessage(e));
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title3" accessibilityLiveRegion="polite">
            {stage}
          </AppText>
          <AppText variant="small" color="textMuted">
            Duelo {st.duel} de {totalDuels}
          </AppText>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceStrong, overflow: 'hidden' }}>
          <View style={{ width: `${((st.duel - 1) / totalDuels) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
        </View>
      </View>
      {voted ? (
        <AppCard>
          <AppText variant="bodyStrong">Voto enviado</AppText>
          <AppText variant="small" color="textMuted">
            Esperando os outros votarem neste duelo. Vence a mais votada; empate vai para sorteio.
          </AppText>
        </AppCard>
      ) : null}
      {pair.map((id, i) => {
        const image = optionImage(state, id);
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={`Votar em ${optionTitle(state, id)}`}
            accessibilityState={{ disabled: voted }}
            disabled={voted}
            onPress={() => vote(id)}
            style={({ pressed }) => [styles.fighter, { backgroundColor: wheelColors[i * 2], opacity: voted ? 0.5 : pressed ? 0.85 : 1 }]}
          >
            {image ? (
              <>
                <Image source={image} resizeMode="cover" style={StyleSheet.absoluteFill} />
                <View style={styles.fade} />
              </>
            ) : null}
            <AppText variant="title2" style={{ color: '#FFFFFF' }}>
              {optionTitle(state, id)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ranking coletivo
// ---------------------------------------------------------------------------
export function RankingView({ state }: { state: RoomState }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState(() => state.options.map((o) => o.id));
  const [busy, setBusy] = useState(false);
  const sent = state.participants.filter((p) => !p.left_at && p.finished_at && p.user_id !== state.me).map((p) => p.display_name);

  const move = (i: number, dir: -1 | 1) =>
    setOrder((o) => {
      const j = i + dir;
      if (j < 0 || j >= o.length) return o;
      const next = [...o];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const submit = async () => {
    setBusy(true);
    try {
      await roomsRepo().submitRanking(state.room.id, order);
      await queryClient.invalidateQueries({ queryKey: ['room', state.room.id] });
    } catch (e) {
      Alert.alert('Sua ordem não foi enviada', roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="title2">Qual você escolhe primeiro?</AppText>
      <AppText color="textMuted">Use as setas para pôr na sua ordem. 1º lugar vale mais pontos.</AppText>
      {order.map((id, i) => (
        <View
          key={id}
          accessible
          accessibilityLabel={`${i + 1}º: ${optionTitle(state, id)}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="bodyStrong" color="onPrimary">
              {i + 1}
            </AppText>
          </View>
          <AppText variant="bodyStrong" style={{ flex: 1 }}>
            {optionTitle(state, id)}
          </AppText>
          <IconButton icon="chevron" plain label={`Subir ${optionTitle(state, id)}`} disabled={i === 0} onPress={() => move(i, -1)} style={{ transform: [{ rotate: '-90deg' }] }} />
          <IconButton icon="chevron" plain label={`Descer ${optionTitle(state, id)}`} disabled={i === order.length - 1} onPress={() => move(i, 1)} style={{ transform: [{ rotate: '90deg' }] }} />
        </View>
      ))}
      {sent.length ? (
        <AppText variant="small" color="textMuted">
          {sent.join(' e ')} já {sent.length === 1 ? 'enviou' : 'enviaram'}.
        </AppText>
      ) : null}
      <AppButton label={busy ? 'Enviando…' : 'Enviar minha ordem'} onPress={submit} disabled={busy} fullWidth />
    </View>
  );
}

export function RankingResultView({ state }: { state: RoomState }) {
  const r = state.result!;
  const n = state.options.length;
  const winner = r.winner_option_id ? optionTitle(state, r.winner_option_id) : '';
  return (
    <>
      {r.winner_option_id ? (
        <ShareableResult fallbackText={`A escolha do grupo no DecideAí: ${winner}!`}>
          <DecisionResultCard eyebrow="A escolha do grupo" title={winner} image={optionImage(state, r.winner_option_id)} caption={r.tied_option_ids.length ? 'Empate no topo resolvido no sorteio.' : `Ranking de ${r.voters} pessoas.`} />
        </ShareableResult>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title3">Como ficou</AppText>
        {r.ranking.map((row, i) => (
          <AppCard key={row.option_id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
            <AppText variant="bodyStrong">
              {i + 1}. {row.title}
            </AppText>
            <AppText variant="small" color="textMuted">
              {row.score} {row.score === 1 ? 'ponto' : 'pontos'}
            </AppText>
          </AppCard>
        ))}
        <AppText variant="small" color="textMuted">
          1º lugar vale {n - 1} pontos, 2º vale {n - 2}, e assim por diante; o último não pontua.
        </AppText>
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// Roleta ao vivo
// ---------------------------------------------------------------------------
export function LiveWheelView({ state, isHost }: { state: RoomState; isHost: boolean }) {
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const wheel = useRef<SpinningWheelHandle>(null);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const animated = useRef(false);
  const result = state.result;
  const labels = state.options.map((o) => o.title);
  const winnerIndex = result?.winner_option_id ? state.options.findIndex((o) => o.id === result.winner_option_id) : -1;

  useEffect(() => {
    if (animated.current || winnerIndex < 0 || !wheel.current) return;
    animated.current = true;
    // Mesmo ângulo em todos os aparelhos: vem do resultado e do deslocamento sorteados no servidor.
    const step = sectorSize(labels.length);
    const landing = winnerIndex * step + step * (result?.spin_offset ?? 0.5);
    const target = 6 * 360 + ((360 - landing) % 360);
    wheel.current.spinTo(target, () => setRevealed(true));
  }, [winnerIndex, labels.length, result?.spin_offset]);

  const spin = async () => {
    setBusy(true);
    try {
      await roomsRepo().spinLiveWheel(state.room.id);
      await queryClient.invalidateQueries({ queryKey: ['room', state.room.id] });
    } catch (e) {
      Alert.alert('Não deu para girar', roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const host = state.participants.find((p) => p.user_id === state.room.host_id)?.display_name ?? 'Quem criou';
  const winner = winnerIndex >= 0 ? labels[winnerIndex] : '';

  return (
    <View style={{ gap: spacing.lg, alignItems: 'stretch' }}>
      <View style={{ alignItems: 'center' }}>
        <SpinningWheel ref={wheel} labels={labels} size={Math.min(width - 40, 320)} accessibilityLabel={`Roleta ao vivo com ${labels.length} opções`} />
      </View>
      {revealed ? (
        <ShareableResult fallbackText={`Deu ${winner} na roleta ao vivo do DecideAí!`}>
          <DecisionResultCard title={winner} caption={`Todos viram o mesmo giro. ${result?.voters ?? 0} pessoas na sala.`} />
        </ShareableResult>
      ) : winnerIndex >= 0 ? (
        <AppText variant="title2" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
          Girando…
        </AppText>
      ) : isHost ? (
        <AppButton label={busy ? 'Girando…' : 'Girar para todos'} onPress={spin} disabled={busy || state.participants.filter((p) => !p.left_at).length < 2} fullWidth />
      ) : (
        <AppText color="textMuted" style={{ textAlign: 'center' }}>
          {host} vai girar. Todos veem o mesmo giro e o mesmo resultado.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fighter: { minHeight: 150, borderRadius: 28, overflow: 'hidden', justifyContent: 'flex-end', padding: spacing.lg },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', backgroundColor: 'rgba(10,6,24,0.55)' },
});

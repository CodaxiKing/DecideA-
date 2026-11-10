import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { usePreferencesStore } from '../../stores/preferencesStore';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon, type IconName } from '../ui/Icon';


export type DeckVote = 'yes' | 'maybe' | 'no';

export interface DeckItem {
  id: string;
  title: string;
  image?: ImageSourcePropType;
  color: string;
  tags: string[];
  text?: string;
  badge?: string;
}

export interface SwipeDeckProps {
  items: DeckItem[];
  onVote: (item: DeckItem, vote: DeckVote) => void;
  onEnd: () => void;
  /** Texto acima do cartão, por exemplo "Ana · opção 2 de 8". */
  label?: (position: number, total: number) => string;
  note?: string;
  cardHeight?: number;
}

const THRESHOLD = 110;

/**
 * Cartões de arrastar: direita = quero, esquerda = não quero, para cima = talvez.
 * Os três botões ficam sempre disponíveis (acessibilidade). Com movimento reduzido,
 * o cartão troca sem animação. Serve a filmes, salas, Match e Passa o celular.
 */
export function SwipeDeck({ items, onVote, onEnd, label, note, cardHeight = 420 }: SwipeDeckProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const haptics = usePreferencesStore((s) => s.hapticsEnabled);
  const [index, setIndex] = useState(0);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const top = items[index];
  const next = items[index + 1];

  useEffect(() => {
    if (index >= items.length && items.length > 0) onEnd();
  }, [index, items.length, onEnd]);

  const commit = (vote: DeckVote) => {
    if (!top) return;
    onVote(top, vote);
    if (haptics) Haptics.selectionAsync().catch(() => {});
    tx.value = 0;
    ty.value = 0;
    setIndex((i) => i + 1);
  };

  const fling = (vote: DeckVote) => {
    if (!top) return;
    if (reduceMotion) {
      commit(vote);
      return;
    }
    const toX = vote === 'yes' ? width * 1.4 : vote === 'no' ? -width * 1.4 : 0;
    const toY = vote === 'maybe' ? -cardHeight * 1.6 : 0;
    tx.value = withTiming(toX, { duration: 220 });
    ty.value = withTiming(toY, { duration: 220 }, (done) => {
      if (done) scheduleOnRN(commit, vote);
    });
  };

  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      tx.value = e.translationX;
      ty.value = e.translationY;
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationX > THRESHOLD) scheduleOnRN(fling, 'yes');
      else if (e.translationX < -THRESHOLD) scheduleOnRN(fling, 'no');
      else if (e.translationY < -THRESHOLD) scheduleOnRN(fling, 'maybe');
      else {
        tx.value = withSpring(0);
        ty.value = withSpring(0);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${interpolate(tx.value, [-width, width], [-14, 14])}deg` },
    ],
  }));
  const yesStamp = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [0, THRESHOLD], [0, 1], 'clamp') }));
  const noStamp = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-THRESHOLD, 0], [1, 0], 'clamp') }));
  const mayStamp = useAnimatedStyle(() => ({ opacity: interpolate(ty.value, [-THRESHOLD, 0], [1, 0], 'clamp') }));

  if (!top) return null;

  const buttons: { vote: DeckVote; label: string; icon: IconName }[] = [
    { vote: 'no', label: 'Não quero', icon: 'close' },
    { vote: 'maybe', label: 'Talvez', icon: 'clock' },
    { vote: 'yes', label: 'Quero', icon: 'heart' },
  ];

  return (
    <View style={{ gap: spacing.md }}>
      {label ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="bodyStrong">{label(index + 1, items.length)}</AppText>
            {note ? (
              <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, height: 28, justifyContent: 'center' }}>
                <AppText variant="label">{note}</AppText>
              </View>
            ) : null}
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceStrong, overflow: 'hidden' }}>
            <View style={{ width: `${(index / items.length) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
          </View>
        </View>
      ) : null}

      <View style={{ height: cardHeight + 120 }}>
        {next ? (
          <View style={[styles.card, { height: cardHeight, transform: [{ scale: 0.95 }], top: 10 }]} importantForAccessibility="no-hide-descendants">
            <Poster item={next} height={cardHeight} />
          </View>
        ) : null}
        <GestureDetector gesture={pan}>
          <Animated.View
            key={top.id}
            accessible
            accessibilityLabel={`${top.title}. ${top.tags.join(', ')}. ${top.text ?? ''}`}
            accessibilityHint="Arraste para a direita se quer, para a esquerda se não quer, ou use os botões abaixo."
            style={[styles.card, cardStyle]}
          >
            <View style={{ height: cardHeight }}>
              <Poster item={top} height={cardHeight} />
              <Animated.View style={[styles.stamp, styles.stampYes, { borderColor: '#13A36E' }, yesStamp]}>
                <AppText variant="title2" style={{ color: '#13A36E' }}>Quero</AppText>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.stampNo, { borderColor: '#FF8FA5' }, noStamp]}>
                <AppText variant="title2" style={{ color: '#FF8FA5' }}>Não</AppText>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.stampMay, { borderColor: '#FFFFFF' }, mayStamp]}>
                <AppText variant="title2" style={{ color: '#FFFFFF' }}>Talvez</AppText>
              </Animated.View>
            </View>
            <View style={{ gap: spacing.sm, paddingTop: spacing.md }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {top.tags.map((t) => (
                  <View key={t} style={{ backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, height: 28, justifyContent: 'center' }}>
                    <AppText variant="label">{t}</AppText>
                  </View>
                ))}
              </View>
              {top.text ? (
                <AppText variant="small" numberOfLines={3}>
                  {top.text}
                </AppText>
              ) : null}
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-start' }}>
        {buttons.map((b) => {
          const big = b.vote === 'yes';
          const size = big ? 84 : 72;
          return (
            <View key={b.vote} style={{ alignItems: 'center', gap: 4 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={b.label}
                onPress={() => fling(b.vote)}
                style={({ pressed }) => ({
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: big ? colors.primary : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Icon name={b.icon} size={30} color={big ? colors.onPrimary : colors.text} />
              </Pressable>
              <AppText variant={big ? 'smallStrong' : 'small'}>{b.label}</AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Poster({ item, height }: { item: DeckItem; height: number }) {
  return (
    <View style={{ height, borderRadius: 28, overflow: 'hidden', backgroundColor: item.color }}>
      {item.image ? (
        <>
          <Image source={item.image} resizeMode="cover" style={StyleSheet.absoluteFill} />
          <View style={styles.fade} />
        </>
      ) : null}
      {item.badge ? (
        <View style={styles.badge}>
          <AppText variant="label" style={{ color: '#1B1036' }}>
            {item.badge}
          </AppText>
        </View>
      ) : null}
      <AppText variant="title1" style={styles.posterTitle} numberOfLines={3}>
        {item.title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 0, right: 0, top: 0 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: 'rgba(10,6,24,0.55)' },
  posterTitle: { position: 'absolute', left: 20, right: 20, bottom: 18, color: '#FFFFFF' },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 28,
    justifyContent: 'center',
  },
  stamp: { position: 'absolute', top: 28, borderWidth: 3, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  stampYes: { left: 20, transform: [{ rotate: '-12deg' }] },
  stampNo: { right: 20, transform: [{ rotate: '12deg' }] },
  stampMay: { alignSelf: 'center', left: '35%' },
});

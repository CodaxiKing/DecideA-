import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import { WheelSvg } from './WheelSvg';

export interface SpinningWheelHandle {
  /** Anima a roda até a rotação absoluta indicada e avisa ao terminar. */
  spinTo: (targetRotation: number, onDone: () => void) => void;
  getRotation: () => number;
}

export interface SpinningWheelProps {
  labels: string[];
  size: number;
  accessibilityLabel: string;
}

export const SPIN_DURATION_MS = 4200;

export const SpinningWheel = forwardRef<SpinningWheelHandle, SpinningWheelProps>(function SpinningWheel(
  { labels, size, accessibilityLabel },
  ref,
) {
  const { colors } = useTheme();
  const rotation = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useImperativeHandle(
    ref,
    () => ({
      getRotation: () => rotation.value,
      spinTo: (target, onDone) => {
        cancelAnimation(rotation);
        if (reduceMotion) {
          rotation.value = target;
          onDone();
          return;
        }
        rotation.value = withTiming(
          target,
          { duration: SPIN_DURATION_MS, easing: Easing.bezier(0.12, 0.6, 0.15, 1) },
          (finished) => {
            if (finished) scheduleOnRN(onDone);
          },
        );
      },
    }),
    [rotation, reduceMotion],
  );

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={{ width: size, height: size + 22, alignItems: 'center' }}>
      <Animated.View style={[{ position: 'absolute', top: 22, width: size, height: size }, wheelStyle]}>
        <WheelSvg labels={labels} size={size} accessibilityLabel={accessibilityLabel} />
      </Animated.View>
      <Svg width={32} height={26} style={{ position: 'absolute', top: 0, zIndex: 2 }}>
        <Path d="M0 0H32L16 26Z" fill={colors.text} />
      </Svg>
    </View>
  );
});

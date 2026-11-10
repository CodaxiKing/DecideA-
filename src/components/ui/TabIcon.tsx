import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type TabIconName = 'home' | 'heart' | 'clock' | 'person';

/** Ícones de traço da barra inferior, copiados do canvas (Main.dc.html). */
export function TabIcon({ name, color, size = 22 }: { name: TabIconName; color: ColorValue; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'home' && <Path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" {...stroke} />}
      {name === 'heart' && <Path d="M12 20s-7-4.6-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.4-9 9-9 9z" {...stroke} />}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 7v5l3 2" {...stroke} />
        </>
      )}
      {name === 'person' && (
        <>
          <Circle cx="12" cy="8" r="4" {...stroke} />
          <Path d="M4 21c1-5 4-7 8-7s7 2 8 7" {...stroke} />
        </>
      )}
    </Svg>
  );
}

import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'plus'
  | 'trash'
  | 'edit'
  | 'copy'
  | 'share'
  | 'close'
  | 'heart'
  | 'heartFilled'
  | 'clock'
  | 'search'
  | 'check'
  | 'shuffle'
  | 'filter'
  | 'chevron'
  | 'users'
  | 'film'
  | 'food'
  | 'wheel';

/** Ícones de traço no estilo do canvas (24×24, traço 1,8). */
export function Icon({ name, color, size = 22 }: { name: IconName; color: ColorValue; size?: number }) {
  const s = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...s} />}
      {name === 'trash' && <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" {...s} />}
      {name === 'edit' && <Path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" {...s} />}
      {name === 'copy' && (
        <>
          <Rect x="8" y="8" width="12" height="12" rx="3" {...s} />
          <Path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" {...s} />
        </>
      )}
      {name === 'share' && <Path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" {...s} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...s} />}
      {name === 'heart' && <Path d="M12 20s-7-4.6-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.4-9 9-9 9z" {...s} />}
      {name === 'heartFilled' && (
        <Path d="M12 20s-7-4.6-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.4-9 9-9 9z" {...s} fill={color} />
      )}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="9" {...s} />
          <Path d="M12 7v5l3 2" {...s} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx="11" cy="11" r="7" {...s} />
          <Path d="M20 20l-4-4" {...s} />
        </>
      )}
      {name === 'check' && <Path d="M5 12l5 5 9-10" {...s} />}
      {name === 'shuffle' && <Path d="M4 7h3c5 0 5 10 10 10h3M17 14l3 3-3 3M4 17h3c1.6 0 2.7-1 3.6-2.4M13.4 9.4C14.3 8 15.4 7 17 7h3M17 4l3 3-3 3" {...s} />}
      {name === 'filter' && <Path d="M4 6h16M7 12h10M10 18h4" {...s} />}
      {name === 'chevron' && <Path d="M9 6l6 6-6 6" {...s} />}
      {name === 'users' && (
        <>
          <Circle cx="9" cy="8" r="3.5" {...s} />
          <Path d="M3 20c.6-3.5 3-5.5 6-5.5s5.4 2 6 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.6.8 2.7 2.6 3 5.2" {...s} />
        </>
      )}
      {name === 'film' && (
        <>
          <Rect x="3" y="5" width="18" height="14" rx="3" {...s} />
          <Path d="M3 10h18M8 5v5M16 5v5" {...s} />
        </>
      )}
      {name === 'food' && <Path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2.5 1.5-3.5 4-3.5 7v3H17" {...s} />}
      {name === 'wheel' && (
        <>
          <Circle cx="12" cy="12" r="9" {...s} />
          <Path d="M12 3v9l7.8 4.5M12 12l-7.8 4.5" {...s} />
        </>
      )}
    </Svg>
  );
}

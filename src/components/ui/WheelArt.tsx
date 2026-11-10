import Svg, { Circle, Path } from 'react-native-svg';

import { wheelColors } from '../../theme/tokens';

function sector(cx: number, cy: number, r: number, start: number, end: number): string {
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${cx + r * Math.cos(rad)} ${cy + r * Math.sin(rad)}`;
  };
  return `M${cx} ${cy} L${toXY(start)} A${r} ${r} 0 0 1 ${toXY(end)} Z`;
}

/** Roda decorativa do cartão da Roleta, com miolo branco como no canvas. */
export function WheelArt({ size = 172 }: { size?: number }) {
  const r = size / 2;
  const step = 360 / wheelColors.length;
  return (
    <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no">
      {wheelColors.map((fill, i) => (
        <Path key={fill} d={sector(r, r, r, -30 + i * step, -30 + (i + 1) * step)} fill={fill} />
      ))}
      <Circle cx={r} cy={r} r={r * 0.22} fill="#FFFFFF" />
    </Svg>
  );
}

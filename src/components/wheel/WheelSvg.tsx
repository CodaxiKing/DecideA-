import { memo } from 'react';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { fontFamily, wheelColors } from '../../theme/tokens';

const LIGHT_FILLS = new Set(['#B9A2FF', '#C9DCFF']);

/** Cor de cada setor, evitando que o último repita a cor do primeiro. */
export function sectorColor(index: number, count: number): string {
  let color = wheelColors[index % wheelColors.length];
  if (count > 1 && index === count - 1 && color === wheelColors[0]) color = wheelColors[2];
  return color;
}

function arcPath(c: number, r: number, start: number, end: number): string {
  const p = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(c + r * Math.cos(rad)).toFixed(2)} ${(c + r * Math.sin(rad)).toFixed(2)}`;
  };
  const large = end - start > 180 ? 1 : 0;
  return `M${c} ${c} L${p(start)} A${r} ${r} 0 ${large} 1 ${p(end)} Z`;
}

function shorten(label: string, max: number): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export interface WheelSvgProps {
  labels: string[];
  size: number;
  accessibilityLabel?: string;
}

/** Roda da roleta: setor 0 começa no topo, sentido horário (ver spin.ts). */
export const WheelSvg = memo(function WheelSvg({ labels, size, accessibilityLabel }: WheelSvgProps) {
  const n = Math.max(labels.length, 1);
  const c = size / 2;
  const step = 360 / n;
  const fontSize = n <= 6 ? size * 0.06 : n <= 10 ? size * 0.05 : size * 0.042;
  const maxChars = n <= 6 ? 12 : n <= 10 ? 10 : 8;

  return (
    <Svg width={size} height={size} accessibilityLabel={accessibilityLabel} accessibilityRole="image">
      {labels.length === 1 ? (
        <Circle cx={c} cy={c} r={c} fill={wheelColors[0]} />
      ) : (
        labels.map((_, i) => <Path key={i} d={arcPath(c, c, i * step, (i + 1) * step)} fill={sectorColor(i, n)} />)
      )}
      {labels.map((label, i) => {
        const mid = i * step + step / 2;
        const fill = LIGHT_FILLS.has(sectorColor(i, n)) ? '#1B1036' : '#FFFFFF';
        // Texto radial, da borda para o centro, legível em qualquer quantidade de opções.
        return (
          <G key={`t${i}`} rotation={mid} originX={c} originY={c}>
            <SvgText
              x={c}
              y={c - c * 0.6}
              fill={fill}
              fontSize={fontSize}
              fontFamily={fontFamily.bodySemiBold}
              fontWeight="700"
              textAnchor="middle"
              rotation={n > 6 ? -90 : 0}
              originX={c}
              originY={c - c * 0.6}
            >
              {shorten(label, maxChars)}
            </SvgText>
          </G>
        );
      })}
      <Circle cx={c} cy={c} r={size * 0.094} fill="#FFFFFF" />
    </Svg>
  );
});

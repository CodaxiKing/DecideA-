import Svg, { Circle, Defs, Mask, Path, Rect } from 'react-native-svg';

/** Roda roxa com setor lilás (design/canvas/img/mark.svg). */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" accessibilityElementsHidden importantForAccessibility="no">
      <Defs>
        <Mask id="hole">
          <Rect width="28" height="28" fill="#fff" />
          <Circle cx="14" cy="14" r="3.1" fill="#000" />
        </Mask>
      </Defs>
      <Circle cx="14" cy="14" r="13" fill="#5B25E8" mask="url(#hole)" />
      <Path d="M14.3 14V1a13 13 0 0 1 11 19.3z" fill="#BBA6FA" mask="url(#hole)" />
    </Svg>
  );
}

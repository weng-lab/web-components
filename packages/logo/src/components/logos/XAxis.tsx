import React from "react";

import { xrange } from "./utils/utils";
import type { XAxisProps } from "./types";

/**
 * Renders an x-axis with logo position numbers.
 *
 * @prop n the total number of positions in the logo.
 * @prop transform SVG transform to apply to the axis.
 * @prop glyphWidth the width of each glyph in the containing logo.
 * @prop startPos the number of the first position in the logo.
 */
export const XAxis: React.FC<XAxisProps> = ({
  n,
  transform,
  glyphWidth,
  startPos,
}) => {
  const numbers: number[] = xrange(n);
  return (
    <g transform={transform}>
      <g transform="rotate(-90)">
        {numbers.map((n: number) => (
          <text
            x="0"
            y={glyphWidth * (n + 0.66)}
            fontSize="18"
            textAnchor="end"
            key={n}
          >
            {n + (startPos || 0)}
          </text>
        ))}
      </g>
    </g>
  );
};

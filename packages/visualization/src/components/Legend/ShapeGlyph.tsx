import { getShapePoints } from "../ScatterPlot/helpers";
import type { PointShape } from "../ScatterPlot/types";

/** The scatter plot's point shapes at legend size, drawn with the library's own geometry so they match. */
export type ShapeGlyphProps = {
  shape: PointShape;
  color: string;
  /** Outlined rather than filled, for a value switched off. */
  hollow?: boolean;
  size?: number;
};

/** Radius as a fraction of the box, sized so the widest shape, the X (about 1.68r), isn't clipped. */
const RADIUS_RATIO = 1 / 1.75;

const ShapeGlyph = ({ shape, color, hollow = false, size = 12 }: ShapeGlyphProps) => {
  const center = size / 2;
  const radius = center * RADIUS_RATIO;
  const points = getShapePoints(shape, center, center, radius);
  const fill = hollow ? "transparent" : color;
  // Thin enough that the cross and X read as glyphs rather than blobs at this size.
  const stroke = { stroke: color, strokeWidth: 1.5 };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      {points ? (
        <polygon points={points} fill={fill} {...stroke} strokeLinejoin="round" />
      ) : (
        <circle cx={center} cy={center} r={radius} fill={fill} {...stroke} />
      )}
    </svg>
  );
};

export default ShapeGlyph;

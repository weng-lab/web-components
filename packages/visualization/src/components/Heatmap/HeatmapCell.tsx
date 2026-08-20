import { memo, MouseEvent } from "react";
import { motion } from "framer-motion";
import { getAnimationProps } from "../../utility";
import type { AnimationType } from "../../utility";
import type { AnyBin } from "./HeatmapCells";
import type { PlotTooltipRef } from "../../tooltip";

/** Class on the <g> wrapping each cell. The hover rule keys off this. */
export const CELL_CLASS = "visx-heatmap-cell";
/** Class on the <rect>/<circle> inside each cell. */
export const CELL_SHAPE_CLASS = "visx-heatmap-cell-shape";

/**
 * Hover styling is plain CSS rather than React state: `:hover` costs no render at all, while
 * tracking hover in state re-renders on every cell the pointer crosses. Rendered once per chart
 * by Heatmap, inside the <svg> so it survives the SVG/PNG download serialization.
 *
 * The stroke is always painted in the cell's own fill color, so hovering only has to give it a
 * width. `strokeWidth={0}` below is a presentation attribute, which loses to any CSS rule - so
 * the hover rule wins without needing !important.
 */
export const heatmapCellStyles = `
.${CELL_CLASS} { cursor: pointer; }
.${CELL_SHAPE_CLASS} { transition: stroke-width 0.2s; }
.${CELL_CLASS}:hover .${CELL_SHAPE_CLASS} { stroke-width: 2; }
`;

export interface HeatmapCellProps {
  bin: AnyBin;
  isRect: boolean;
  binWidth: number;
  fill: string;
  fillOpacity: number;
  colIndex: number;
  animationType?: AnimationType;
  /** Stable for the life of the plot, so it never invalidates this cell's memoization. */
  tooltipRef: PlotTooltipRef<AnyBin>;
  onClick?: (bin: AnyBin) => void;
}

/**
 * visx rebuilds every bin object inside its own render, so `bin` always arrives with a fresh
 * identity and memo's default shallow compare can never bail out. Comparing the bin's fields
 * instead lets untouched cells skip re-rendering, which is what makes selection changes cheap:
 * only the cells whose appearance actually changed re-render, rather than the whole grid.
 *
 * `bin.bin` and `bin.datum` are the caller's own row/column data, which do keep identity, so a
 * reference check on those covers data and metadata changes.
 */
const binsEqual = (a: AnyBin, b: AnyBin): boolean => {
  if (
    a.row !== b.row ||
    a.column !== b.column ||
    a.count !== b.count ||
    a.gap !== b.gap ||
    a.color !== b.color ||
    a.opacity !== b.opacity ||
    a.bin !== b.bin ||
    a.datum !== b.datum
  ) {
    return false;
  }
  // Rect and circle cells carry different geometry fields
  if ("x" in a) {
    return "x" in b && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  }
  return "cy" in b && a.cy === b.cy && a.r === b.r && a.radius === b.radius;
};

/**
 * Must compare every prop in HeatmapCellProps - one left out here would silently stop updating.
 */
const cellPropsEqual = (prev: HeatmapCellProps, next: HeatmapCellProps): boolean =>
  prev.fill === next.fill &&
  prev.fillOpacity === next.fillOpacity &&
  prev.isRect === next.isRect &&
  prev.binWidth === next.binWidth &&
  prev.colIndex === next.colIndex &&
  prev.animationType === next.animationType &&
  prev.tooltipRef === next.tooltipRef &&
  prev.onClick === next.onClick &&
  binsEqual(prev.bin, next.bin);

const HeatmapCell = memo(function HeatmapCell({
  bin, isRect, binWidth, fill, fillOpacity, colIndex,
  animationType, tooltipRef, onClick,
}: HeatmapCellProps) {
  const isRectCell = isRect && "width" in bin && "height" in bin && "x" in bin && "y" in bin;
  const isCircleCell = !isRect && "cy" in bin && "r" in bin;

  const sharedProps = { fill, fillOpacity, stroke: fill, strokeWidth: 0 };

  const Wrapper = animationType ? motion.g : "g";
  const animProps = getAnimationProps(animationType as AnimationType, colIndex);

  return (
    <Wrapper
      {...animProps}
      className={CELL_CLASS}
      onMouseMove={(event: MouseEvent<SVGElement>) => tooltipRef.current?.show(bin, event)}
      onMouseLeave={() => tooltipRef.current?.hide()}
      onClick={() => onClick?.(bin)}
    >
      {isRectCell ? (
        <rect
          className={`visx-heatmap-rect ${CELL_SHAPE_CLASS}`}
          width={bin.width}
          height={bin.height}
          x={bin.x}
          y={bin.y}
          {...sharedProps}
        />
      ) : isCircleCell ? (
        <circle
          className={`visx-heatmap-circle ${CELL_SHAPE_CLASS}`}
          cx={bin.column * binWidth + binWidth / 2}
          cy={bin.cy}
          r={bin.r}
          {...sharedProps}
        />
      ) : null}
    </Wrapper>
  );
}, cellPropsEqual);

export default HeatmapCell;

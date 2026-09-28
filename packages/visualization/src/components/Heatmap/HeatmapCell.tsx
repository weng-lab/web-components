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
 * Hover styling as plain CSS, which costs no render, placed inside the <svg> so downloads keep it.
 * The stroke is already the cell's fill color, and this rule beats the `strokeWidth={0}` attribute
 * without !important. `pointer-events: all` keeps null cells (fill="none") hoverable for their
 * tooltip.
 */
export const heatmapCellStyles = `
.${CELL_CLASS} { cursor: pointer; }
.${CELL_SHAPE_CLASS} { transition: stroke-width 0.2s; pointer-events: all; }
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
 * visx builds a fresh bin object every render, so memo compares the bin's fields instead: only
 * cells whose appearance changed re-render. `bin.bin` and `bin.datum` are the caller's own data,
 * so a reference check covers data changes.
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

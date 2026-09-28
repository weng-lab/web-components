import { SELECTION_COLOR } from "./heatmapSelection";

/** How far a pointer reaches from the grid, and half its width. */
const POINTER_LENGTH = 6;
const POINTER_HALF_WIDTH = 4;

interface HeatmapSelectionPointersProps {
  axis: "column" | "row";
  /** The columns or rows holding the selection - see selectionMarks. */
  marked: Set<number>;
  /** The axis's scale, from a column or row index to its place along the grid. */
  scale: (value: number) => number;
}

/**
 * A pointer at the tick of each column or row holding the selection, pointing up at a column from
 * below the grid and right at a row from its left. Drawn in the axis's coordinates, so it scrolls
 * and exports with the axis.
 */
const HeatmapSelectionPointers = ({ axis, marked, scale }: HeatmapSelectionPointersProps) => (
  <g fill={SELECTION_COLOR} pointerEvents="none">
    {[...marked].map((index) => {
      const at = scale(index + 0.5);
      return (
        <path
          key={index}
          d={
            axis === "column"
              ? `M${at},1 l${POINTER_HALF_WIDTH},${POINTER_LENGTH} h${-2 * POINTER_HALF_WIDTH} z`
              : `M-1,${at} l${-POINTER_LENGTH},${-POINTER_HALF_WIDTH} v${2 * POINTER_HALF_WIDTH} z`
          }
        />
      );
    })}
  </g>
);

export default HeatmapSelectionPointers;

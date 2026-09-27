/**
 * How a selection shows: framed, with the columns and rows it belongs to marked on the axes and
 * along the minimap's edges, while every cell keeps its own color. Fading everything unselected
 * hid the very cells a reader was scanning for the next thing to select.
 */

import type { HeatmapCellId } from "./types";
import { cellKey } from "./heatmapCellAppearance";

/** The frame's dark line, and the white one just inside it that holds it against a dark cell. */
export const SELECTION_COLOR = "#1a1c1e";
const HALO_COLOR = "#ffffff";
/**
 * The dark line's thickness, laid outside the selected cells. At the default gap of 2 it fills the
 * gaps around them exactly, covering no cell - neither a selected one nor its neighbor.
 */
const FRAME_WIDTH = 2;
const HALO_WIDTH = 1;

export type SelectionBand = { x: number; y: number; width: number; height: number; fill: string };

type FrameGeometry = {
  xScale: (column: number) => number;
  cellYScale: (row: number) => number;
  binWidth: number;
  binHeight: number;
  gap: number;
};

/** The grid's size, which nothing drawn outside of shows. */
type GridBounds = { width: number; height: number };

/** A cell's key back into its row and column. */
const parseKey = (key: string): HeatmapCellId => {
  const [row, column] = key.split("-").map(Number);
  return { row, column };
};

/**
 * The selected cells within a block of the grid - by walking the block where it holds fewer cells
 * than the selection, by filtering the selection where it holds more, as the whole grid does for a
 * download.
 */
export function* selectedCellsIn(
  selectedKeys: Set<string>,
  { colStart, colEnd, rowStart, rowEnd }: { colStart: number; colEnd: number; rowStart: number; rowEnd: number }
): Generator<HeatmapCellId> {
  if ((colEnd - colStart + 1) * (rowEnd - rowStart + 1) <= selectedKeys.size) {
    for (let column = colStart; column <= colEnd; column++)
      for (let row = rowStart; row <= rowEnd; row++) if (selectedKeys.has(cellKey({ row, column }))) yield { row, column };
    return;
  }
  for (const key of selectedKeys) {
    const cell = parseKey(key);
    if (cell.column >= colStart && cell.column <= colEnd && cell.row >= rowStart && cell.row <= rowEnd) yield cell;
  }
}

/**
 * The frame around the selected cells among `cells`, as rectangles to fill in order: a dark band
 * outside every edge a selected cell shares with an unselected one, or with the grid's edge, then
 * a white line just inside it. Neighboring selected cells share one frame - a selected column is
 * one tall box, and two side by side one wide one - so it reads as what was picked rather than as
 * a grid of little boxes.
 */
export function selectionFrame(
  selectedKeys: Set<string>,
  cells: Iterable<HeatmapCellId>,
  geometry: FrameGeometry,
  bounds: GridBounds
): SelectionBand[] {
  const { xScale, cellYScale, binWidth, binHeight, gap } = geometry;
  const isSelected = (row: number, column: number) => selectedKeys.has(cellKey({ row, column }));
  const dark: SelectionBand[] = [];
  const halo: SelectionBand[] = [];
  const band = (into: SelectionBand[], fill: string, x: number, y: number, width: number, height: number) =>
    into.push({ x, y, width, height, fill });

  for (const { row, column } of cells) {
    if (!isSelected(row, column)) continue;
    // The cell as drawn, with its gap to its right and above it (see getCellGeometry).
    const cellLeft = xScale(column);
    const cellRight = cellLeft + binWidth - gap;
    const cellTop = cellYScale(row) + gap;
    const cellBottom = cellYScale(row) + binHeight;
    // The box the dark line runs round: the cell itself, pulled in wherever the line would fall past
    // the grid's edge and be cut off - at the bottom and left always, where the gaps are on the far
    // side of the cells, and at the top and right where there is less gap than line.
    const left = cellLeft - FRAME_WIDTH < 0 ? cellLeft + FRAME_WIDTH : cellLeft;
    const right = cellRight + FRAME_WIDTH > bounds.width ? cellRight - FRAME_WIDTH : cellRight;
    const top = cellTop - FRAME_WIDTH < 0 ? cellTop + FRAME_WIDTH : cellTop;
    const bottom = cellBottom + FRAME_WIDTH > bounds.height ? cellBottom - FRAME_WIDTH : cellBottom;
    // Row 0 is at the bottom of the grid, so the row above is row + 1.
    const above = isSelected(row + 1, column);
    const below = isSelected(row - 1, column);
    const before = isSelected(row, column - 1);
    const after = isSelected(row, column + 1);
    // How far an edge's line runs on past the box: across the gap to a selected neighbor, so the
    // line is unbroken, or round the corner where there is none.
    const reach = (selected: boolean) => (selected ? gap : FRAME_WIDTH);
    const bridge = (selected: boolean) => (selected ? gap : 0);
    const across = [left - reach(before), right - left + reach(before) + reach(after)] as const;
    const down = [top - reach(above), bottom - top + reach(above) + reach(below)] as const;
    const haloAcross = [left - bridge(before), right - left + bridge(before) + bridge(after)] as const;
    const haloDown = [top - bridge(above), bottom - top + bridge(above) + bridge(below)] as const;

    if (!above) {
      band(dark, SELECTION_COLOR, across[0], top - FRAME_WIDTH, across[1], FRAME_WIDTH);
      band(halo, HALO_COLOR, haloAcross[0], top, haloAcross[1], HALO_WIDTH);
    }
    if (!below) {
      band(dark, SELECTION_COLOR, across[0], bottom, across[1], FRAME_WIDTH);
      band(halo, HALO_COLOR, haloAcross[0], bottom - HALO_WIDTH, haloAcross[1], HALO_WIDTH);
    }
    if (!before) {
      band(dark, SELECTION_COLOR, left - FRAME_WIDTH, down[0], FRAME_WIDTH, down[1]);
      band(halo, HALO_COLOR, left, haloDown[0], HALO_WIDTH, haloDown[1]);
    }
    if (!after) {
      band(dark, SELECTION_COLOR, right, down[0], FRAME_WIDTH, down[1]);
      band(halo, HALO_COLOR, right - HALO_WIDTH, haloDown[0], HALO_WIDTH, haloDown[1]);
    }
  }
  return [...dark, ...halo];
}

/** The columns and rows the axes and minimap mark as holding the selection. */
export type SelectionMarks = { columns: Set<number>; rows: Set<number> };

export const NO_SELECTION_MARKS: SelectionMarks = { columns: new Set(), rows: new Set() };

/**
 * Which columns and rows to mark. A column is marked for a selected cell in it whose row isn't
 * selected all the way across, and a row for one whose column isn't selected all the way down.
 * So a whole selected column marks its column alone - not every row it runs through - and a
 * single selected cell marks both its row and its column, as a spreadsheet lights both headers.
 */
export function selectionMarks(selectedKeys: Set<string> | null, numColumns: number, numRows: number): SelectionMarks {
  if (!selectedKeys?.size) return NO_SELECTION_MARKS;
  const cells = [...selectedKeys].map(parseKey);
  const perColumn = new Map<number, number>();
  const perRow = new Map<number, number>();
  for (const { row, column } of cells) {
    perColumn.set(column, (perColumn.get(column) ?? 0) + 1);
    perRow.set(row, (perRow.get(row) ?? 0) + 1);
  }
  const columns = new Set<number>();
  const rows = new Set<number>();
  for (const { row, column } of cells) {
    if ((perRow.get(row) ?? 0) < numColumns) columns.add(column);
    if ((perColumn.get(column) ?? 0) < numRows) rows.add(row);
  }
  return { columns, rows };
}

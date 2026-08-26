import type { ColumnDatum, HeatmapCellId } from "./types";
import type { AnyBin } from "./HeatmapCells";
import { cellKey, resolveCellAppearance } from "./heatmapCellAppearance";

/**
 * Everything the canvas draw loop and hit-testing need to place a cell exactly where the SVG
 * path (HeatmapCells.tsx, via @visx/heatmap's HeatmapRect/HeatmapCircle) would. xScale/cellYScale
 * are the same functions Heatmap.tsx already builds and passes to HeatmapCells.
 */
export interface CanvasCellParams {
  data: ColumnDatum[];
  numRows: number;
  xScale: (column: number) => number;
  cellYScale: (row: number) => number;
  colorScale: (count: number) => string | undefined;
  opacityScale: (count: number) => number | undefined;
  gap: number;
  isRect: boolean;
  binWidth: number;
  binHeight: number;
  yMax: number;
  selectedKeys: Set<string> | null;
  deselectedColor: string;
}

export interface CanvasDrawRange {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Mirrors @visx/heatmap's HeatmapRect/HeatmapCircle bin geometry exactly (see their source:
// node_modules/@visx/heatmap/lib/heatmaps/{HeatmapRect,HeatmapCircle}.js) so canvas-drawn cells
// land on the same pixels the SVG path (export, non-scrollable mode) would draw them at. The
// circle center's x mirrors HeatmapCell.tsx's own recomputation (col*binWidth + binWidth/2)
// rather than @visx/heatmap's raw cx, for the same reason that file does it: keeps circles
// centered in their cell regardless of the configured radius.
type CellGeometry =
  | { isRect: true; x: number; y: number; width: number; height: number }
  | { isRect: false; cx: number; cy: number; r: number; radius: number };

function getCellGeometry(params: CanvasCellParams, col: number, row: number): CellGeometry {
  const { xScale, cellYScale, gap, isRect, binWidth, binHeight } = params;
  if (isRect) {
    return { isRect: true, x: xScale(col), y: cellYScale(row) + gap, width: binWidth - gap, height: binHeight - gap };
  }
  const radius = Math.min(binWidth, binHeight) / 2;
  return { isRect: false, cx: col * binWidth + binWidth / 2, cy: cellYScale(row) + gap + radius, r: radius - gap, radius };
}

/**
 * Column/row index bounds (inclusive) that intersect the given scroll viewport, plus a small
 * overscan so a cell is already drawn just before it scrolls into view rather than popping in a
 * frame late. Row bounds are derived from cellYScale's own convention (row 0 at the bottom of
 * the grid, row numRows-1 at the top): a cell at row r occupies content-y band
 * [yMax-(r+1)*binHeight, yMax-r*binHeight), so the row under a given y is
 * floor((yMax-y)/binHeight).
 */
export function getVisibleRange(
  params: CanvasCellParams,
  scrollLeft: number,
  scrollTop: number,
  viewportWidth: number,
  viewportHeight: number,
  overscan: number
): CanvasDrawRange {
  const { data, numRows, binWidth, binHeight, yMax } = params;
  return {
    colStart: clamp(Math.floor(scrollLeft / binWidth) - overscan, 0, Math.max(0, data.length - 1)),
    colEnd: clamp(Math.ceil((scrollLeft + viewportWidth) / binWidth) + overscan, 0, Math.max(0, data.length - 1)),
    rowStart: clamp(Math.floor((yMax - (scrollTop + viewportHeight)) / binHeight) - overscan, 0, Math.max(0, numRows - 1)),
    rowEnd: clamp(Math.floor((yMax - scrollTop) / binHeight) + overscan, 0, Math.max(0, numRows - 1)),
  };
}

/** Paints the cells in `range` onto `ctx`, whose origin is already at content-space (0,0). */
export function drawHeatmapCells(
  ctx: CanvasRenderingContext2D,
  params: CanvasCellParams,
  range: CanvasDrawRange,
  hoveredCell: HeatmapCellId | null
) {
  const { data, colorScale, opacityScale, selectedKeys, deselectedColor } = params;
  for (let col = range.colStart; col <= range.colEnd; col++) {
    const columnDatum = data[col];
    if (!columnDatum) continue;
    for (let row = range.rowStart; row <= range.rowEnd; row++) {
      const rowDatum = columnDatum.rows[row];
      if (!rowDatum) continue;
      const count = rowDatum.count;
      const color = count == null ? undefined : colorScale(count);
      const opacity = count == null ? undefined : opacityScale(count);
      const isDeselected = !!selectedKeys && !selectedKeys.has(cellKey({ row, column: col }));
      const { fill, fillOpacity } = resolveCellAppearance(count, color, opacity, isDeselected, deselectedColor);
      if (fillOpacity <= 0) continue;

      const geometry = getCellGeometry(params, col, row);
      ctx.globalAlpha = fillOpacity;
      ctx.fillStyle = fill;
      ctx.beginPath();
      if (geometry.isRect) {
        ctx.rect(geometry.x, geometry.y, Math.max(geometry.width, 0), Math.max(geometry.height, 0));
      } else {
        ctx.arc(geometry.cx, geometry.cy, Math.max(geometry.r, 0), 0, Math.PI * 2);
      }
      ctx.fill();

      if (hoveredCell && hoveredCell.row === row && hoveredCell.column === col) {
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = fill;
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** Content-space (post-scroll-offset) coordinates -> the cell under them, or null if none. */
export function hitTestCell(params: CanvasCellParams, contentX: number, contentY: number): HeatmapCellId | null {
  const { data, numRows, binWidth, binHeight, yMax } = params;
  if (contentX < 0 || contentY < 0) return null;
  const column = Math.floor(contentX / binWidth);
  const row = Math.floor((yMax - contentY) / binHeight);
  if (column < 0 || column >= data.length || row < 0 || row >= numRows) return null;
  if (!data[column]?.rows[row]) return null;
  return { row, column };
}

/** Builds the same bin shape @visx/heatmap's RectCell/CircleCell provide, for onClick/tooltipBody. */
export function buildBin(params: CanvasCellParams, cell: HeatmapCellId): AnyBin | null {
  const columnDatum = params.data[cell.column];
  const rowDatum = columnDatum?.rows[cell.row];
  if (!columnDatum || !rowDatum) return null;

  const count = rowDatum.count;
  const color = count == null ? undefined : params.colorScale(count);
  const opacity = count == null ? undefined : params.opacityScale(count);
  const geometry = getCellGeometry(params, cell.column, cell.row);
  const shared = { bin: rowDatum, row: cell.row, column: cell.column, datum: columnDatum, gap: params.gap, count, color, opacity };

  return geometry.isRect
    ? ({ ...shared, x: geometry.x, y: geometry.y, width: geometry.width, height: geometry.height } as AnyBin)
    : ({ ...shared, cx: geometry.cx, cy: geometry.cy, r: geometry.r, radius: geometry.radius } as AnyBin);
}

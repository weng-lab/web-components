import type { ColumnDatum, HeatmapCellId } from "./types";
import type { AnyBin } from "./HeatmapCells";
import { DIMMED_OPACITY, isOutsideRange, resolveCellAppearance } from "./heatmapCellAppearance";
import { selectedCellsIn, selectionFrame, type SelectionMarks } from "./heatmapSelection";

/** What the canvas renderers and hit-testing need to place and color cells as the SVG renderer does. */
export interface CanvasCellParams {
  data: ColumnDatum[];
  numRows: number;
  xScale: (column: number) => number;
  cellYScale: (row: number) => number;
  colorScale: (count: number) => string | undefined;
  /** The counts colorScale spans, which the overview samples it across. */
  minValue: number;
  maxValue: number;
  gap: number;
  isRect: boolean;
  binWidth: number;
  binHeight: number;
  yMax: number;
  /** The selected cells' keys, which the grid frames; null where nothing is selected. */
  selectedKeys: Set<string> | null;
  /** The columns and rows holding the selection, which the minimap marks along its edges. */
  selectionMarks: SelectionMarks;
  highlightRange: [number, number] | null;
}

export interface CanvasDrawRange {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Mirrors @visx/heatmap's HeatmapRect/HeatmapCircle geometry, so canvas cells land on the pixels SVG
// cells would. A circle's x is centered in its cell, as HeatmapCell.tsx recomputes it.
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
 * The columns and rows (inclusive) within the scrolled viewport, plus `overscan` either side. Row 0
 * is at the bottom, so the row under content y is floor((yMax - y) / binHeight).
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

/** Paints the cells in `range` onto `ctx`, whose origin is already at content-space (0,0), and the selection's frame over them. */
export function drawHeatmapCells(
  ctx: CanvasRenderingContext2D,
  params: CanvasCellParams,
  range: CanvasDrawRange,
  hoveredCell: HeatmapCellId | null
) {
  const { data, colorScale, selectedKeys, highlightRange } = params;
  // Setting fillStyle re-parses the color even when unchanged, so repeats are skipped: an export
  // runs this for every cell. A path is built only for the hovered cell, to stroke its outline.
  let lastFill: string | null = null;
  let lastAlpha = -1;
  for (let col = range.colStart; col <= range.colEnd; col++) {
    const columnDatum = data[col];
    if (!columnDatum) continue;
    for (let row = range.rowStart; row <= range.rowEnd; row++) {
      const rowDatum = columnDatum.rows[row];
      if (!rowDatum) continue;
      const count = rowDatum.count;
      const color = count == null ? undefined : colorScale(count);
      const isDimmed = isOutsideRange(count, highlightRange);
      const { fill, fillOpacity } = resolveCellAppearance(count, color, isDimmed);
      if (fillOpacity <= 0) continue;

      const geometry = getCellGeometry(params, col, row);
      if (fillOpacity !== lastAlpha) {
        ctx.globalAlpha = fillOpacity;
        lastAlpha = fillOpacity;
      }
      if (fill !== lastFill) {
        ctx.fillStyle = fill;
        lastFill = fill;
      }

      const isHovered = hoveredCell !== null && hoveredCell.row === row && hoveredCell.column === col;
      if (geometry.isRect) {
        const width = Math.max(geometry.width, 0);
        const height = Math.max(geometry.height, 0);
        ctx.fillRect(geometry.x, geometry.y, width, height);
        if (isHovered) {
          ctx.beginPath();
          ctx.rect(geometry.x, geometry.y, width, height);
        }
      } else {
        ctx.beginPath();
        ctx.arc(geometry.cx, geometry.cy, Math.max(geometry.r, 0), 0, Math.PI * 2);
        ctx.fill();
      }

      if (isHovered) {
        ctx.globalAlpha = 1;
        lastAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = fill;
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  if (selectedKeys) {
    // Past the range by a cell, so the frame's line for a selected cell just outside it still shows.
    const around = {
      colStart: range.colStart - 1,
      colEnd: range.colEnd + 1,
      rowStart: range.rowStart - 1,
      rowEnd: range.rowEnd + 1,
    };
    const bounds = { width: data.length * params.binWidth, height: params.yMax };
    for (const { x, y, width, height, fill } of selectionFrame(selectedKeys, selectedCellsIn(selectedKeys, around), params, bounds)) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, width, height);
    }
  }
}

// Colors sampled from colorScale for the overview, which looks them up rather than calling it per cell.
const OVERVIEW_LEVELS = 256;

let colorParser: CanvasRenderingContext2D | null = null;
/** Any CSS color as RGB, read back off a 1px canvas, so a color the browser understands is one this does. */
function parseColor(css: string): [number, number, number] {
  colorParser ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!colorParser) return [0, 0, 0];
  colorParser.clearRect(0, 0, 1, 1);
  colorParser.fillStyle = "#000";
  colorParser.fillStyle = css;
  colorParser.fillRect(0, 0, 1, 1);
  const [r, g, b] = colorParser.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

// Keyed on identities the layout memoizes, which a highlight sweep leaves alone.
const lutCache = new WeakMap<object, Uint8ClampedArray>();
const countsCache = new WeakMap<ColumnDatum[], Float64Array>();

function colorLut(params: CanvasCellParams): Uint8ClampedArray {
  const cached = lutCache.get(params.colorScale);
  if (cached) return cached;
  const { colorScale, minValue, maxValue } = params;
  const lut = new Uint8ClampedArray(OVERVIEW_LEVELS * 3);
  for (let i = 0; i < OVERVIEW_LEVELS; i++) {
    const [r, g, b] = parseColor(colorScale(minValue + ((maxValue - minValue) * i) / (OVERVIEW_LEVELS - 1)) ?? "#000");
    lut.set([r, g, b], i * 3);
  }
  lutCache.set(params.colorScale, lut);
  return lut;
}

/** Every count in one column-major array, NaN where there is none: several times faster to scan than the row objects. */
function flatCounts(data: ColumnDatum[], numRows: number): Float64Array {
  const cached = countsCache.get(data);
  if (cached && cached.length === data.length * numRows) return cached;
  const counts = new Float64Array(data.length * numRows).fill(NaN);
  data.forEach((column, c) =>
    column.rows.forEach((row, r) => {
      if (r < numRows && row.count != null) counts[c * numRows + r] = row.count;
    })
  );
  countsCache.set(data, counts);
  return counts;
}

/**
 * The whole grid resampled to `width` x `height` pixels for the minimap, written straight into an
 * ImageData: a fillRect per cell took ~400ms on a million-cell grid.
 *
 * Each pixel averages the cells under it. While highlightRange is set, a pixel holding any cell in
 * the range shows those cells alone at full strength, so a lone outlier isn't averaged away. Cells
 * are drawn as solid squares, without gaps, circles or the selection frame - the minimap marks the
 * selection along its edges instead.
 */
function renderHeatmapOverview(params: CanvasCellParams, width: number, height: number): ImageData | null {
  const { data, numRows, highlightRange, minValue, maxValue } = params;
  const numColumns = data.length;
  if (numColumns === 0 || numRows === 0 || width < 1 || height < 1) return null;

  const lut = colorLut(params);
  const counts = flatCounts(data, numRows);
  const span = maxValue - minValue;
  // With no range, every cell is inside it: nothing fades and nothing is singled out.
  const [low, high] = highlightRange ?? [-Infinity, Infinity];
  const image = new ImageData(width, height);
  const pixels = image.data;

  // The run of columns (rows) each pixel column (row) covers: at least one, and between them every one.
  const spans = (cells: number, size: number) =>
    Array.from({ length: size }, (_, i) => {
      const start = Math.min(Math.floor((i * cells) / size), cells - 1);
      return [start, Math.max(start + 1, Math.floor(((i + 1) * cells) / size))] as const;
    });
  const columnSpans = spans(numColumns, width);
  // From the top down, where row 0 sits at the bottom of the grid (see cellYScale).
  const rowSpans = spans(numRows, height);

  // Scalars and typed arrays only in here: it runs once per cell per redraw.
  for (let y = 0; y < height; y++) {
    const [rowFrom, rowTo] = rowSpans[y];
    for (let x = 0; x < width; x++) {
      const [columnFrom, columnTo] = columnSpans[x];
      // Opacity-weighted sums over every cell, and plain sums over the highlighted ones.
      let r = 0, g = 0, b = 0, a = 0, cells = 0;
      let hr = 0, hg = 0, hb = 0, highlighted = 0;
      for (let column = columnFrom; column < columnTo; column++) {
        const base = column * numRows;
        for (let fromTop = rowFrom; fromTop < rowTo; fromTop++) {
          const index = base + numRows - 1 - fromTop;
          cells++;
          const count = counts[index];
          if (count !== count) continue; // NaN: transparent, as a null cell is drawn nowhere.
          // Held at the ends, as the color scale itself clamps.
          const level = span > 0 ? Math.round(Math.min(Math.max((count - minValue) / span, 0), 1) * (OVERVIEW_LEVELS - 1)) * 3 : 0;
          const cr = lut[level], cg = lut[level + 1], cb = lut[level + 2];
          // isOutsideRange, inlined.
          const inRange = count >= low && count <= high;
          if (inRange && highlightRange) {
            hr += cr; hg += cg; hb += cb; highlighted++;
          }
          const opacity = inRange ? 1 : DIMMED_OPACITY;
          r += cr * opacity; g += cg * opacity; b += cb * opacity; a += opacity;
        }
      }
      const offset = (y * width + x) * 4;
      if (highlighted > 0) {
        pixels[offset] = hr / highlighted;
        pixels[offset + 1] = hg / highlighted;
        pixels[offset + 2] = hb / highlighted;
        pixels[offset + 3] = 255;
      } else if (a > 0) {
        pixels[offset] = r / a;
        pixels[offset + 1] = g / a;
        pixels[offset + 2] = b / a;
        pixels[offset + 3] = (a / cells) * 255;
      }
    }
  }
  return image;
}

let overviewScratch: HTMLCanvasElement | null = null;

/**
 * The whole grid, filling the canvas. Rendered at no more than a pixel per cell and stretched
 * nearest-neighbor from there: resampling every pixel of the expanded minimap took over 100ms.
 */
export function drawHeatmapOverview(ctx: CanvasRenderingContext2D, params: CanvasCellParams) {
  const { width, height } = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const overviewWidth = Math.min(width, params.data.length);
  const overviewHeight = Math.min(height, params.numRows);
  const overview = renderHeatmapOverview(params, overviewWidth, overviewHeight);
  if (!overview) return;
  if (overviewWidth === width && overviewHeight === height) {
    ctx.putImageData(overview, 0, 0);
  } else {
    overviewScratch ??= document.createElement("canvas");
    overviewScratch.width = overviewWidth;
    overviewScratch.height = overviewHeight;
    overviewScratch.getContext("2d")?.putImageData(overview, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(overviewScratch, 0, 0, width, height);
  }
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
  const geometry = getCellGeometry(params, cell.column, cell.row);
  const shared = { bin: rowDatum, row: cell.row, column: cell.column, datum: columnDatum, gap: params.gap, count, color, opacity: count == null ? undefined : 1 };

  return geometry.isRect
    ? ({ ...shared, x: geometry.x, y: geometry.y, width: geometry.width, height: geometry.height } as AnyBin)
    : ({ ...shared, cx: geometry.cx, cy: geometry.cy, r: geometry.r, radius: geometry.radius } as AnyBin);
}

import type { ColumnDatum, HeatmapCellId } from "./types";
import type { AnyBin } from "./HeatmapCells";
import { DESELECTED_OPACITY, DIMMED_OPACITY, cellKey, isOutsideRange, resolveCellAppearance } from "./heatmapCellAppearance";

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
  /** The counts colorScale spans, which the overview samples it across. */
  minValue: number;
  maxValue: number;
  gap: number;
  isRect: boolean;
  binWidth: number;
  binHeight: number;
  yMax: number;
  selectedKeys: Set<string> | null;
  deselectedColor: string;
  highlightRange: [number, number] | null;
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
  const { data, colorScale, selectedKeys, deselectedColor, highlightRange } = params;
  // fillStyle/globalAlpha assignment forces the browser to re-parse the CSS color string even
  // when it's unchanged from the previous cell - skipping redundant writes matters at this scale
  // (this loop runs per-cell, up to hundreds of thousands of times for the minimap's full-dataset
  // draw). Rects also use fillRect directly (no beginPath/rect/fill trio) since it's a faster
  // native path for solid fills; a path is only built for a cell when it's the hovered one, so
  // its outline can still be stroked.
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
      const isDeselected = !!selectedKeys && !selectedKeys.has(cellKey({ row, column: col }));
      const isDimmed = isOutsideRange(count, highlightRange);
      const { fill, fillOpacity } = resolveCellAppearance(count, color, isDeselected, deselectedColor, isDimmed);
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
}

// Colors the overview reads out of colorScale, sampled across its domain: far fewer than the cells,
// and plenty for a grid drawn at a fraction of a pixel per cell.
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

// Keyed on the identities the layout memoizes, so a sweep - which changes none of them - reuses them.
const lutCache = new WeakMap<object, Uint8ClampedArray>();
const selectionCache = new WeakMap<Set<string>, Uint8Array>();
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

/** selectedKeys as a flag per cell, column-major, so the overview's loop never builds a key string. */
function selectionMask(selectedKeys: Set<string>, numRows: number, numColumns: number): Uint8Array {
  const cached = selectionCache.get(selectedKeys);
  if (cached && cached.length === numRows * numColumns) return cached;
  const mask = new Uint8Array(numRows * numColumns);
  selectedKeys.forEach((key) => {
    const [row, column] = key.split("-").map(Number);
    if (row < numRows && column < numColumns) mask[column * numRows + row] = 1;
  });
  selectionCache.set(selectedKeys, mask);
  return mask;
}

/**
 * Every cell's count in one flat array, column-major, NaN where there is none: the overview's loop
 * reads it for each of up to a million cells on every step of a sweep, and reading the row objects
 * instead - scattered across the heap - cost several times as much.
 */
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
 * The whole grid resampled to `width` x `height` device pixels, for the minimap. Filling each cell as
 * its own rectangle, as the main grid does, meant a million fillRect calls for a lipidomics-sized
 * grid - some 400ms, on every change a legend sweep makes - to paint a picture a fraction of a pixel
 * per cell. This walks the cells once and writes pixels straight into an ImageData: a few
 * milliseconds.
 *
 * Each pixel averages the cells under it where cells are smaller than pixels, and takes the one cell
 * it falls in where they are larger, so a small grid stays crisp rather than smeared. While a
 * highlightRange is set, a pixel with any cell in the range under it shows those cells alone, at their
 * full strength: averaged in with the faded cells around it, a single outlier among fourteen rows to a
 * pixel would vanish from the one view that shows the whole grid at once.
 *
 * Colors, selection and fading come out as drawHeatmapCells draws them; gaps and circles don't - each
 * cell is a solid square, which at a minimap's scale is a difference of shading.
 */
export function renderHeatmapOverview(params: CanvasCellParams, width: number, height: number): ImageData | null {
  const { data, numRows, selectedKeys, deselectedColor, highlightRange, minValue, maxValue } = params;
  const numColumns = data.length;
  if (numColumns === 0 || numRows === 0 || width < 1 || height < 1) return null;

  const lut = colorLut(params);
  const counts = flatCounts(data, numRows);
  const mask = selectedKeys ? selectionMask(selectedKeys, numRows, numColumns) : null;
  const [deselectedR, deselectedG, deselectedB] = parseColor(deselectedColor);
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
      // Premultiplied sums, over every cell and over the highlighted ones alone.
      let r = 0, g = 0, b = 0, a = 0, cells = 0;
      let hr = 0, hg = 0, hb = 0, ha = 0, highlighted = 0;
      for (let column = columnFrom; column < columnTo; column++) {
        const base = column * numRows;
        for (let fromTop = rowFrom; fromTop < rowTo; fromTop++) {
          const index = base + numRows - 1 - fromTop;
          cells++;
          const count = counts[index];
          if (count !== count) continue; // NaN: transparent, as a null cell is drawn nowhere.
          let cr: number, cg: number, cb: number, opacity: number;
          if (mask !== null && mask[index] === 0) {
            cr = deselectedR; cg = deselectedG; cb = deselectedB; opacity = DESELECTED_OPACITY;
          } else {
            // Held at the ends, as the color scale itself clamps.
            const level = span > 0 ? Math.round(Math.min(Math.max((count - minValue) / span, 0), 1) * (OVERVIEW_LEVELS - 1)) * 3 : 0;
            cr = lut[level]; cg = lut[level + 1]; cb = lut[level + 2]; opacity = 1;
          }
          // isOutsideRange, inlined.
          if (count >= low && count <= high) {
            if (highlightRange) {
              hr += cr * opacity; hg += cg * opacity; hb += cb * opacity; ha += opacity; highlighted++;
            }
          } else {
            opacity *= DIMMED_OPACITY;
          }
          r += cr * opacity; g += cg * opacity; b += cb * opacity; a += opacity;
        }
      }
      const offset = (y * width + x) * 4;
      if (highlighted > 0) {
        pixels[offset] = hr / ha;
        pixels[offset + 1] = hg / ha;
        pixels[offset + 2] = hb / ha;
        pixels[offset + 3] = (ha / highlighted) * 255;
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
 * The whole grid, filling the canvas - see renderHeatmapOverview. Resampled at no more than a pixel
 * per cell along either axis and stretched from there, nearest-neighbor, rather than at every device
 * pixel: the expanded minimap spans most of a Retina screen, some four million pixels over a grid of
 * under a million cells, and resampling each of them took over 100ms - on every step a legend sweep
 * takes. Stretching a cell-sized picture gives the same crisp squares for the price of the cells.
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
    return;
  }
  overviewScratch ??= document.createElement("canvas");
  overviewScratch.width = overviewWidth;
  overviewScratch.height = overviewHeight;
  overviewScratch.getContext("2d")?.putImageData(overview, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(overviewScratch, 0, 0, width, height);
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

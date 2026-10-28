import { rgb } from "@visx/vendor/d3-color";
import { rampAt, type ColorRange, type RampStop } from "../Legend/colorbarAxis";
import { DIMMED_OPACITY } from "../Heatmap/heatmapCellAppearance";
import { SELECTION_COLOR } from "../Heatmap/heatmapSelection";
import { visibleCells, type View } from "./view";

const LEVELS = 256;

/** A ramp as LEVELS rgb triples, low end first. */
export const rampLut = (stops: readonly RampStop[]) => {
  const at = rampAt(stops);
  const lut = new Uint8ClampedArray(LEVELS * 3);
  for (let i = 0; i < LEVELS; i++) {
    const { r, g, b } = rgb(at(i / (LEVELS - 1)));
    lut[i * 3] = r;
    lut[i * 3 + 1] = g;
    lut[i * 3 + 2] = b;
  }
  return lut;
};

export type CellColors = {
  lut: Uint8ClampedArray;
  /** The values the ramp spans; beyond, its end colors. */
  domain: ColorRange;
  /** Values outside it fade. Null for none. */
  highlight: ColorRange | null;
};

/** The gap between neighboring cells, once they're big enough to spare one. */
const gapFor = (cellSize: number) => (cellSize >= 12 ? 2 : cellSize >= 6 ? 1 : 0);

/** How many cells to average into each pixel along an axis, so a pixel is at least a device pixel. */
const cellsPerPixel = (devicePixelsPerCell: number) =>
  devicePixelsPerCell >= 1 ? 1 : 2 ** Math.ceil(Math.log2(1 / devicePixelsPerCell));

/**
 * The cells as an image, a pixel each, scaled onto the plot's canvas: zooming and panning only
 * redraw it, and only recoloring touches every cell. Zoomed out past a device pixel a cell, it's
 * drawn from a copy averaged down to fit, so no cell is skipped.
 *
 * Everything that draws cells goes through here, so a GPU version could stand in for it.
 */
export class CellRaster {
  private readonly image: ImageData;
  /** The image averaged down, by cells per pixel across and down, built as zooming needs them. */
  private readonly levels = new Map<string, HTMLCanvasElement>();
  private highlighting = false;

  constructor(
    private readonly values: ArrayLike<number>,
    readonly rows: number,
    readonly columns: number
  ) {
    this.image = new ImageData(columns, rows);
  }

  recolor({ lut, domain: [low, high], highlight }: CellColors) {
    const { values, rows, columns } = this;
    const pixels = this.image.data;
    const span = high - low;
    const [from, to] = highlight ?? [-Infinity, Infinity];
    const dimmed = Math.round(DIMMED_OPACITY * 255);
    // Scalars and typed arrays only: this runs once per cell per recolor.
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        const value = values[column * rows + row];
        const offset = (row * columns + column) * 4;
        if (value !== value) {
          pixels[offset + 3] = 0;
          continue;
        }
        const level = span > 0 ? Math.round(Math.min(Math.max((value - low) / span, 0), 1) * (LEVELS - 1)) * 3 : 0;
        pixels[offset] = lut[level];
        pixels[offset + 1] = lut[level + 1];
        pixels[offset + 2] = lut[level + 2];
        pixels[offset + 3] = value >= from && value <= to ? 255 : dimmed;
      }
    }
    this.highlighting = highlight !== null;
    this.levels.clear();
  }

  /** The view's cells on a `width` x `height` CSS px context at `dpr`, with gaps between cells big enough to show them. */
  draw(ctx: CanvasRenderingContext2D, view: View, width: number, height: number, dpr: number) {
    const { x, y } = view;
    const across = cellsPerPixel(x.scale * dpr);
    const down = cellsPerPixel(y.scale * dpr);
    const level = this.level(across, down);
    const [firstColumn, endColumn] = visibleCells(x, { cells: this.columns, size: width, maxCell: 0 });
    const [firstRow, endRow] = visibleCells(y, { cells: this.rows, size: height, maxCell: 0 });
    // In the level's pixels, which may each hold several cells.
    const left = Math.floor(firstColumn / across);
    const right = Math.ceil(endColumn / across);
    const top = Math.floor(firstRow / down);
    const bottom = Math.ceil(endRow / down);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      level,
      left, top, right - left, bottom - top,
      x.translate + left * across * x.scale, y.translate + top * down * y.scale,
      (right - left) * across * x.scale, (bottom - top) * down * y.scale
    );
    const columnGap = gapFor(x.scale);
    const rowGap = gapFor(y.scale);
    if (columnGap) {
      for (let c = firstColumn + 1; c < endColumn; c++) ctx.clearRect(x.translate + c * x.scale - columnGap / 2, 0, columnGap, height);
    }
    if (rowGap) {
      for (let r = firstRow + 1; r < endRow; r++) ctx.clearRect(0, y.translate + r * y.scale - rowGap / 2, width, rowGap);
    }
  }

  private level(across: number, down: number): HTMLCanvasElement {
    const key = `${across}x${down}`;
    const cached = this.levels.get(key);
    if (cached) return cached;
    const image = across === 1 && down === 1 ? this.image : this.averaged(across, down);
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d")?.putImageData(image, 0, 0);
    this.levels.set(key, canvas);
    return canvas;
  }

  /**
   * Each pixel the average of the cells under it. While highlighting, a pixel holding any cell in the
   * highlight shows those cells alone at full strength, so a lone one isn't averaged away.
   */
  private averaged(across: number, down: number): ImageData {
    const { columns, rows, highlighting } = this;
    const source = this.image.data;
    const out = new ImageData(Math.ceil(columns / across), Math.ceil(rows / down));
    const pixels = out.data;
    for (let y = 0; y < out.height; y++) {
      const rowEnd = Math.min(rows, (y + 1) * down);
      for (let x = 0; x < out.width; x++) {
        const columnEnd = Math.min(columns, (x + 1) * across);
        let r = 0, g = 0, b = 0, a = 0, cells = 0;
        let hr = 0, hg = 0, hb = 0, highlighted = 0;
        for (let row = y * down; row < rowEnd; row++) {
          for (let column = x * across, i = (row * columns + column) * 4; column < columnEnd; column++, i += 4) {
            const alpha = source[i + 3];
            cells++;
            if (alpha === 255 && highlighting) {
              hr += source[i]; hg += source[i + 1]; hb += source[i + 2];
              highlighted++;
            }
            r += source[i] * alpha; g += source[i + 1] * alpha; b += source[i + 2] * alpha;
            a += alpha;
          }
        }
        const o = (y * out.width + x) * 4;
        if (highlighted > 0) {
          pixels[o] = hr / highlighted; pixels[o + 1] = hg / highlighted; pixels[o + 2] = hb / highlighted;
          pixels[o + 3] = 255;
        } else if (a > 0) {
          pixels[o] = r / a; pixels[o + 1] = g / a; pixels[o + 2] = b / a;
          pixels[o + 3] = a / cells;
        }
      }
    }
    return out;
  }
}

/**
 * A frame around each run of selected columns side by side, so neighbors share one, or a bar
 * through a run too narrow to frame.
 */
export function drawSelectedColumns(ctx: CanvasRenderingContext2D, view: View, columns: Iterable<number>, width: number, height: number) {
  const { scale, translate } = view.x;
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.fillStyle = SELECTION_COLOR;
  ctx.lineWidth = 2;
  const sorted = [...columns].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; ) {
    const first = sorted[i];
    let end = first + 1;
    while (++i < sorted.length && sorted[i] === end) end++;
    const left = translate + first * scale;
    const runWidth = (end - first) * scale;
    if (left > width || left + runWidth < 0) continue;
    if (runWidth >= 6) ctx.strokeRect(left + 1, 1, runWidth - 2, height - 2);
    else ctx.fillRect(left + runWidth / 2 - 1, 0, 2, height);
  }
}

/** An outline around the cell under the pointer. */
export function drawHoveredCell(ctx: CanvasRenderingContext2D, view: View, row: number, column: number) {
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    view.x.translate + column * view.x.scale + 0.75,
    view.y.translate + row * view.y.scale + 0.75,
    view.x.scale - 1.5,
    view.y.scale - 1.5
  );
}

import { ScaleLinear } from "@visx/vendor/d3-scale";
import { rgb } from "@visx/vendor/d3-color";
import { scaleLinear } from "@visx/scale";
import { BackgroundField } from "./types";

export const DEFAULT_FIELD_COLORS = ["blue", "white", "red"];

/** Where a field's legend sits: this far right of the plot area, and this wide. */
export const FIELD_LEGEND_GAP = 25;
export const FIELD_LEGEND_WIDTH = 75;

/** Colors sampled from the color scale, which each pixel looks its value up in rather than interpolating. */
const LEVELS = 256;

/**
 * Bounds on the raster's side, in pixels. The floor keeps a coarse grid smooth once it is stretched
 * over the plot; the ceiling keeps a million-cell grid to a few milliseconds and a few megabytes.
 */
const MIN_RASTER = 256;
const MAX_RASTER = 1024;

const rasterSize = (gridLines: number) => Math.min(MAX_RASTER, Math.max(MIN_RASTER, gridLines));

/** The color scale as LEVELS RGBA entries, low to high, its colors spaced evenly along it. */
const colorTable = (colors: readonly string[]) => {
    const stops = colors.map((color) => rgb(color));
    const last = stops.length - 1;
    const table = new Uint8ClampedArray(LEVELS * 4);
    for (let level = 0; level < LEVELS; level++) {
        const at = last > 0 ? (level / (LEVELS - 1)) * last : 0;
        // The pair of colors this level falls between; the top level belongs to the last pair.
        const segment = Math.min(Math.floor(at), Math.max(last - 1, 0));
        const from = stops[segment];
        const to = stops[Math.min(segment + 1, last)];
        const mix = at - segment;
        table[level * 4] = from.r + (to.r - from.r) * mix;
        table[level * 4 + 1] = from.g + (to.g - from.g) * mix;
        table[level * 4 + 2] = from.b + (to.b - from.b) * mix;
        table[level * 4 + 3] = (from.opacity + (to.opacity - from.opacity) * mix) * 255;
    }
    return table;
};

/**
 * For each of `count` samples spaced evenly across a sorted axis, the grid line at or below it and
 * how far it sits toward the next one. The grid lines need not be evenly spaced themselves - a
 * grid that was even before a log transform isn't - which is why this is looked up, not computed.
 */
const sampleAxis = (axis: ArrayLike<number>, count: number) => {
    const below = new Int32Array(count);
    const mix = new Float32Array(count);
    const first = axis[0];
    const span = axis[axis.length - 1] - first;
    let line = 0;
    for (let sample = 0; sample < count; sample++) {
        const at = first + ((sample + 0.5) / count) * span;
        // Samples ascend, so the search carries on from the last one rather than starting over.
        while (line < axis.length - 2 && axis[line + 1] <= at) line++;
        const step = axis[line + 1] - axis[line];
        below[sample] = line;
        mix[sample] = step > 0 ? (at - axis[line]) / step : 0;
    }
    return { below, mix };
};

/**
 * Paints a grid of values into RGBA `pixels`, `width` by `height`, covering the grid's whole
 * extent with the highest y in the top row. Each pixel is interpolated between the four grid
 * values around it, and left transparent where any of them is missing.
 */
export const fillFieldPixels = (
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    x: ArrayLike<number>,
    y: ArrayLike<number>,
    values: ArrayLike<number>,
    [low, high]: readonly [number, number],
    colors: readonly string[]
) => {
    const table = colorTable(colors);
    const columns = sampleAxis(x, width);
    const rows = sampleAxis(y, height);
    const span = high - low;
    const gridWidth = x.length;

    for (let py = 0; py < height; py++) {
        // Pixel rows run down the screen, y runs up it.
        const row = height - 1 - py;
        const lower = rows.below[row] * gridWidth;
        const upper = lower + gridWidth;
        const rowMix = rows.mix[row];
        for (let px = 0; px < width; px++) {
            const i = columns.below[px];
            const columnMix = columns.mix[px];
            const bottom = values[lower + i] + (values[lower + i + 1] - values[lower + i]) * columnMix;
            const top = values[upper + i] + (values[upper + i + 1] - values[upper + i]) * columnMix;
            const value = bottom + (top - bottom) * rowMix;
            if (Number.isNaN(value)) continue;

            const t = span !== 0 ? (value - low) / span : 0.5;
            const level = t <= 0 ? 0 : t >= 1 ? LEVELS - 1 : Math.round(t * (LEVELS - 1));
            const out = (py * width + px) * 4;
            pixels[out] = table[level * 4];
            pixels[out + 1] = table[level * 4 + 1];
            pixels[out + 2] = table[level * 4 + 2];
            pixels[out + 3] = table[level * 4 + 3];
        }
    }
};

/**
 * A grid of values as a bitmap covering its whole extent, to be drawn under the points by
 * drawField. Null where there is nothing to draw: a grid without two lines each way, values that
 * don't fill it, or no document to make a canvas in (a server render).
 */
export const rasterizeField = (
    x: ArrayLike<number>,
    y: ArrayLike<number>,
    values: ArrayLike<number>,
    domain: readonly [number, number],
    colors: readonly string[]
): HTMLCanvasElement | null => {
    if (typeof document === "undefined") return null;
    if (x.length < 2 || y.length < 2 || values.length < x.length * y.length || colors.length === 0) return null;
    if (!(x[x.length - 1] > x[0]) || !(y[y.length - 1] > y[0])) return null;

    const canvas = document.createElement("canvas");
    canvas.width = rasterSize(x.length);
    canvas.height = rasterSize(y.length);
    const context = canvas.getContext("2d");
    if (!context) return null;

    const image = context.createImageData(canvas.width, canvas.height);
    fillFieldPixels(image.data, canvas.width, canvas.height, x, y, values, domain, colors);
    context.putImageData(image, 0, 0);
    return canvas;
};

/**
 * Draws a rasterized field where its grid sits under the zoomed scales. Only the part in view is
 * drawn: zoomed far in, the whole raster would be stretched to a rectangle many times the canvas.
 */
export const drawField = (
    context: CanvasRenderingContext2D,
    raster: HTMLCanvasElement,
    x: ArrayLike<number>,
    y: ArrayLike<number>,
    xST: ScaleLinear<number, number, never>,
    yST: ScaleLinear<number, number, never>,
    width: number,
    height: number,
    opacity = 1
) => {
    const left = xST(x[0]);
    const right = xST(x[x.length - 1]);
    const top = yST(y[y.length - 1]);
    const bottom = yST(y[0]);

    const viewLeft = Math.max(left, 0);
    const viewRight = Math.min(right, width);
    const viewTop = Math.max(top, 0);
    const viewBottom = Math.min(bottom, height);
    if (!(viewRight > viewLeft) || !(viewBottom > viewTop)) return;

    const perPixelX = raster.width / (right - left);
    const perPixelY = raster.height / (bottom - top);

    context.globalAlpha = opacity;
    context.drawImage(
        raster,
        (viewLeft - left) * perPixelX,
        (viewTop - top) * perPixelY,
        (viewRight - viewLeft) * perPixelX,
        (viewBottom - viewTop) * perPixelY,
        viewLeft,
        viewTop,
        viewRight - viewLeft,
        viewBottom - viewTop
    );
    context.globalAlpha = 1;
};

/** Ticks for a field's colorbar: round values across its domain, about one per 45px of bar. */
export const getFieldTicks = (
    [low, high]: readonly [number, number],
    barHeight: number,
    format?: (value: number) => string
) => {
    const scale = scaleLinear<number>({ domain: [low, high] });
    const count = Math.max(2, Math.round(barHeight / 45));
    const write = format ?? scale.tickFormat(count);
    if (high === low) return [{ at: 0.5, label: write(low) }];
    return scale.ticks(count).map((value) => ({ at: (value - low) / (high - low), label: write(value) }));
};

/**
 * Builds a backgroundField's grid from one entry per grid point, in any order: the x, y and value
 * of each, as three parallel arrays - the columns of a table with a row per point. Spread the
 * result into the field alongside its domain.
 *
 * Coordinates are matched exactly, so transform them before passing them in (a log2 of each, say)
 * rather than after. Points with a coordinate that isn't finite - the log of zero - are dropped,
 * and grid points the table never mentions are left empty.
 */
export const getFieldGrid = (
    x: ArrayLike<number>,
    y: ArrayLike<number>,
    value: ArrayLike<number>
): Pick<BackgroundField, "x" | "y" | "values"> => {
    const count = Math.min(x.length, y.length, value.length);
    const uniqueX = new Set<number>();
    const uniqueY = new Set<number>();
    for (let k = 0; k < count; k++) {
        if (!Number.isFinite(x[k]) || !Number.isFinite(y[k])) continue;
        uniqueX.add(x[k]);
        uniqueY.add(y[k]);
    }

    const gridX = Float64Array.from(uniqueX).sort();
    const gridY = Float64Array.from(uniqueY).sort();
    const column = new Map<number, number>();
    const row = new Map<number, number>();
    gridX.forEach((at, i) => column.set(at, i));
    gridY.forEach((at, j) => row.set(at, j));

    const values = new Float32Array(gridX.length * gridY.length).fill(NaN);
    for (let k = 0; k < count; k++) {
        const i = column.get(x[k]);
        const j = row.get(y[k]);
        if (i !== undefined && j !== undefined) values[j * gridX.length + i] = value[k];
    }
    return { x: gridX, y: gridY, values };
};

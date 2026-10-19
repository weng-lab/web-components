import { bin as d3bin, range, Bin } from '@visx/vendor/d3-array';
import { HistogramBinEdges, HistogramBinning, HistogramNormalize } from './types';

/** One series binned against a set of edges */
export interface SeriesBins {
    /** Bin boundaries, one longer than `counts` */
    edges: number[];
    counts: number[];
    /** The values that fell in each bin */
    values: number[][];
    /** Number of values binned, used as the normalization denominator */
    total: number;
}

export interface BinnedSeries extends SeriesBins {
    /** Drawn bar heights after normalization */
    heights: number[];
}

export interface BinnedHistogram {
    series: BinnedSeries[];
    /**
     * Bins over all series combined. Only present for shared binning,
     * where every entry of `series` uses these same edges.
     */
    combined?: SeriesBins;
    /** Leftmost and rightmost edge across every series */
    domain: [number, number];
    /** True when every value is a whole number */
    isInteger: boolean;
}

export interface HistogramBinningOptions {
    thresholds?: number | number[];
    binning?: HistogramBinning;
    binEdges?: HistogramBinEdges;
    normalize?: HistogramNormalize;
}

const DEFAULT_NICE_THRESHOLDS = 20;
const DEFAULT_EQUAL_WIDTH_BINS = 10;

/** Min and max of the finite values, found with a loop so large inputs can't overflow the call stack */
export function finiteExtent(values: ArrayLike<number>): [number, number] | undefined {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (!Number.isFinite(v)) continue;
        if (v < min) min = v;
        if (v > max) max = v;
    }
    return min <= max ? [min, max] : undefined;
}

function allIntegers(values: ArrayLike<number>): boolean {
    for (let i = 0; i < values.length; i++) {
        if (!Number.isInteger(values[i])) return false;
    }
    return true;
}

/**
 * Equal-width edges as numpy builds them: `linspace(min, max, binCount + 1)` with the
 * last edge set exactly to max. A zero-width range is widened to [v - 0.5, v + 0.5].
 */
export function equalWidthEdges(min: number, max: number, binCount: number): number[] {
    if (min === max) {
        min -= 0.5;
        max += 0.5;
    }
    const step = (max - min) / binCount;
    const edges = new Array<number>(binCount + 1);
    for (let i = 0; i < binCount; i++) edges[i] = i * step + min;
    edges[binCount] = max;
    return edges;
}

/**
 * Assigns values to equal-width `edges` with numpy's rule: index from the bin width, then
 * corrected by one bin against the computed edges. The top edge belongs to the last bin.
 * Values outside the edges are dropped.
 */
export function binEqualWidth(values: ArrayLike<number>, edges: number[]): SeriesBins {
    const binCount = edges.length - 1;
    const first = edges[0];
    const last = edges[binCount];
    // numpy multiplies by bins / range rather than dividing, keep the same operation order
    const norm = binCount / (last - first);
    const counts = new Array<number>(binCount).fill(0);
    const binValues: number[][] = Array.from({ length: binCount }, () => []);
    let total = 0;

    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (!(v >= first && v <= last)) continue;
        let idx = Math.floor((v - first) * norm);
        if (idx === binCount) idx -= 1;
        if (v < edges[idx]) idx -= 1;
        else if (idx !== binCount - 1 && v >= edges[idx + 1]) idx += 1;
        counts[idx]++;
        binValues[idx].push(v);
        total++;
    }

    return { edges, counts, values: binValues, total };
}

function toBins(d3Bins: Bin<number, number>[]): SeriesBins {
    const edges = d3Bins.map((b) => b.x0 ?? 0);
    edges.push(d3Bins[d3Bins.length - 1]?.x1 ?? 0);
    let total = 0;
    const counts = d3Bins.map((b) => {
        total += b.length;
        return b.length;
    });
    // d3's bins are already arrays of their values, so hand them out without copying
    return { edges, counts, values: d3Bins, total };
}

/**
 * The component's original d3 binning: `thresholds` is a hint for a "nice" bin count, or an
 * explicit list of edges. Small integer ranges get one bin per integer.
 */
export function binNice(values: number[], thresholds: number | number[] | undefined, isInteger: boolean): SeriesBins {
    const extent = finiteExtent(values);
    if (!extent) return { edges: [], counts: [], values: [], total: 0 };
    const [dataMin, dataMax] = extent;
    const integerValueCount = dataMax - dataMin + 1;

    let binner;
    if (Array.isArray(thresholds)) {
        binner = d3bin().thresholds(thresholds);
    } else if (isInteger && integerValueCount <= (thresholds ?? DEFAULT_NICE_THRESHOLDS)) {
        // Requesting ~20 "nice" thresholds over a small integer range (e.g. 0-3) makes d3
        // pick a fractional step (e.g. 0.2), splintering each integer into its own narrow,
        // gapped bin. Snap to one bin per integer value instead.
        const innerEdges = range(dataMin + 1, dataMax + 1);
        binner = d3bin().domain([dataMin, dataMax + 1]).thresholds(innerEdges);
    } else {
        binner = d3bin().thresholds(thresholds ?? DEFAULT_NICE_THRESHOLDS);
    }
    return toBins(binner(values));
}

/** Re-bins values against edges produced by `binNice` */
export function binWithEdges(values: ArrayLike<number>, edges: number[]): SeriesBins {
    if (edges.length < 2) return { edges, counts: [], values: [], total: 0 };
    const binner = d3bin().domain([edges[0], edges[edges.length - 1]]).thresholds(edges.slice(1, -1));
    const data = Array.isArray(values) ? values : Array.from(values);
    return toBins(binner(data));
}

/**
 * Scales one series' counts.
 * - count: unchanged
 * - probability: count / total, so the heights sum to 1
 * - density: count / (total × bin width), so the bar areas sum to 1
 */
export function normalizeCounts(counts: number[], edges: number[], total: number, normalize: HistogramNormalize): number[] {
    if (normalize === 'count') return counts;
    if (total === 0) return counts.map(() => 0);
    if (normalize === 'probability') return counts.map((c) => c / total);
    return counts.map((c, i) => c / (total * (edges[i + 1] - edges[i])));
}

function concatValues(series: ArrayLike<number>[]): number[] {
    if (series.length === 1 && Array.isArray(series[0])) return series[0];
    let length = 0;
    for (const s of series) length += s.length;
    const out = new Array<number>(length);
    let k = 0;
    for (const s of series) {
        for (let i = 0; i < s.length; i++) out[k++] = s[i];
    }
    return out;
}

function sumBins(parts: SeriesBins[], edges: number[]): SeriesBins {
    const binCount = edges.length - 1;
    const counts = new Array<number>(binCount).fill(0);
    const values: number[][] = Array.from({ length: binCount }, () => []);
    let total = 0;
    for (const p of parts) {
        total += p.total;
        for (let i = 0; i < binCount; i++) {
            counts[i] += p.counts[i];
            const bv = p.values[i];
            for (let j = 0; j < bv.length; j++) values[i].push(bv[j]);
        }
    }
    return { edges, counts, values, total };
}

/** Bins every series according to the histogram's binning options */
export function binHistogram(seriesValues: ArrayLike<number>[], options: HistogramBinningOptions = {}): BinnedHistogram | undefined {
    const { thresholds, binning = 'shared', binEdges = 'nice', normalize = 'count' } = options;
    const isInteger = seriesValues.some((s) => s.length > 0) && seriesValues.every(allIntegers);
    const equalWidth = binEdges === 'equalWidth' && !Array.isArray(thresholds);
    const binCount = Math.max(1, Math.round(typeof thresholds === 'number' ? thresholds : DEFAULT_EQUAL_WIDTH_BINS));

    let perSeries: SeriesBins[];
    let combined: SeriesBins | undefined;

    if (binning === 'perSeries') {
        perSeries = seriesValues.map((values) => {
            if (equalWidth) {
                const extent = finiteExtent(values);
                if (!extent) return { edges: [], counts: [], values: [], total: 0 };
                return binEqualWidth(values, equalWidthEdges(extent[0], extent[1], binCount));
            }
            const data = Array.isArray(values) ? values : Array.from(values);
            return binNice(data, thresholds, allIntegers(values));
        });
    } else if (equalWidth) {
        let min = Infinity;
        let max = -Infinity;
        for (const values of seriesValues) {
            const extent = finiteExtent(values);
            if (!extent) continue;
            if (extent[0] < min) min = extent[0];
            if (extent[1] > max) max = extent[1];
        }
        if (min > max) return undefined;
        const edges = equalWidthEdges(min, max, binCount);
        perSeries = seriesValues.map((values) => binEqualWidth(values, edges));
        combined = sumBins(perSeries, edges);
    } else {
        combined = binNice(concatValues(seriesValues), thresholds, isInteger);
        if (combined.counts.length === 0) return undefined;
        const edges = combined.edges;
        perSeries = seriesValues.map((values) => binWithEdges(values, edges));
    }

    let domainMin = Infinity;
    let domainMax = -Infinity;
    for (const s of perSeries) {
        if (s.edges.length < 2) continue;
        if (s.edges[0] < domainMin) domainMin = s.edges[0];
        if (s.edges[s.edges.length - 1] > domainMax) domainMax = s.edges[s.edges.length - 1];
    }
    if (domainMin > domainMax) return undefined;

    return {
        series: perSeries.map((s) => ({ ...s, heights: normalizeCounts(s.counts, s.edges, s.total, normalize) })),
        combined,
        domain: [domainMin, domainMax],
        isInteger,
    };
}

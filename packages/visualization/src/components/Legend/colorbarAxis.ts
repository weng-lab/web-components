/**
 * The arithmetic behind a colorbar: where a value sits along the bar, how many values fall in each
 * stretch, and the ranges its colors can span. Values come sorted ascending and are bisected, so a
 * heatmap's hundreds of thousands of cells cost no more than a plot's points.
 */

import { rgb } from "@visx/vendor/d3-color";

/** Where the colors stop, in the units the ramp is drawn in. Values beyond take the end colors. */
export type ColorRange = [low: number, high: number];

/** A color stop, `at` from 0 at the low end of the ramp to 1 at its high end. Any CSS color. */
export type RampStop = { at: number; color: string };

/** Sequential runs low to high. Diverging runs out both ways from 0, so its range stays symmetric (±limit). */
export type RampKind = "sequential" | "diverging";

/** A stretch of the bar, from 0 at its low end to 1 at its high end. */
export type RampRange = { from: number; to: number };

/** A range the editor offers in one click. */
export type RangePreset = { label: string; range: ColorRange };

type Sorted = ArrayLike<number>;

/** How many values lie below x. */
const lowerBound = (sorted: Sorted, x: number) => {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

/** How many values lie at or below x. */
const upperBound = (sorted: Sorted, x: number) => {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

/** Linear interpolation between closest ranks, as numpy's default. */
export const percentile = (sorted: Sorted, p: number) => {
  const rank = ((sorted.length - 1) * p) / 100;
  const below = Math.floor(rank);
  const above = Math.min(below + 1, sorted.length - 1);
  return sorted[below] + (sorted[above] - sorted[below]) * (rank - below);
};

/** The middle of the values, with `clip` percent trimmed off each end, so a few extreme values don't wash out the rest. */
export const percentileRange = (sorted: Sorted, clip: number): ColorRange => [
  percentile(sorted, clip),
  percentile(sorted, 100 - clip),
];

/** Colors spaced evenly along the ramp, as Heatmap spaces its `colors`. */
export const evenStops = (colors: readonly string[]): RampStop[] =>
  colors.map((color, i) => ({ at: i / (colors.length - 1), color }));

/** Where values sit along a bar, and which value sits at each place. */
export type BarAxis = {
  /** A value's place along the bar, from 0 at its low end to 1 at its high end. */
  toT: (value: number) => number;
  /** The value at a place along the bar. */
  fromT: (t: number) => number;
  /** Places where the scale changes pace, which the bar marks with a gap. */
  breaks: number[];
};

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);

/** The compact legend's axis: the colors' range, with values beyond held at the ends, as their colors are. */
export const rangeAxis = ([low, high]: ColorRange): BarAxis => {
  const span = high - low;
  return {
    toT: (value) => (span > 0 ? clamp01((value - low) / span) : 0.5),
    fromT: (t) => low + t * span,
    breaks: [],
  };
};

/** Share of the bar each squeezed tail takes, where it has one. */
const TAIL_SHARE = 0.16;

/**
 * The range editor's axis, spanning every value: linear across `core`, where nearly every value
 * lies, and logarithmic in the tails, squeezed into the last 16% at either end. Independent of the
 * range, so a dragged handle stays under the cursor.
 */
export const squeezedAxis = (core: ColorRange, extent: ColorRange, kind: RampKind): BarAxis => {
  const [low, high] = core;
  const reach = Math.max(-extent[0], extent[1], high);
  const [lowest, highest] = kind === "diverging" ? [-reach, reach] : extent;
  const hasLowTail = lowest < low;
  const hasHighTail = highest > high;
  const lowShare = hasLowTail ? TAIL_SHARE : 0;
  const highShare = hasHighTail ? TAIL_SHARE : 0;
  const coreShare = 1 - lowShare - highShare;
  // The tails' softness: a tail shorter than this stays near-linear, a longer one compresses.
  const unit = (high - low) / 10 || 1;
  const lowLength = Math.log1p((low - lowest) / unit);
  const highLength = Math.log1p((highest - high) / unit);

  return {
    toT: (value) => {
      if (value < low) return hasLowTail ? clamp01(lowShare * (1 - Math.log1p((low - value) / unit) / lowLength)) : 0;
      if (value > high)
        return hasHighTail ? clamp01(1 - highShare + (highShare * Math.log1p((value - high) / unit)) / highLength) : 1;
      return high > low ? lowShare + (coreShare * (value - low)) / (high - low) : 0.5;
    },
    fromT: (t) => {
      if (t < lowShare) return low - unit * Math.expm1((1 - t / lowShare) * lowLength);
      if (t > 1 - highShare) return high + unit * Math.expm1(((t - (1 - highShare)) / highShare) * highLength);
      return low + ((t - lowShare) / coreShare) * (high - low);
    },
    breaks: [lowShare, 1 - highShare].filter((b) => b > 0 && b < 1),
  };
};

/** How many values fall in each of `bins` equal stretches of the bar, found at each stretch's edge. */
export const histogram = (sorted: Sorted, axis: BarAxis, bins: number): number[] => {
  const counts = new Array<number>(bins);
  let previous = 0;
  for (let k = 0; k < bins; k++) {
    const next = k === bins - 1 ? sorted.length : lowerBound(sorted, axis.fromT((k + 1) / bins));
    counts[k] = next - previous;
    previous = next;
  }
  return counts;
};

/**
 * The values a sweep of a colorbar spanning `range` takes in, as [low, high] inclusive: what a plot
 * highlights for it. Open-ended at the bar's ends, to take in the values clamped there.
 */
export const sweptValues = (range: ColorRange, { from, to }: RampRange): ColorRange => {
  const { fromT } = rangeAxis(range);
  return [from <= 0 ? -Infinity : fromT(from), to >= 1 ? Infinity : fromT(to)];
};

/** Whether values lie past each end of a range and so take its end color: what "≤" and "≥" say. */
export const clampedEnds = (sorted: Sorted, [low, high]: ColorRange) => ({
  low: sorted.length > 0 && sorted[0] < low,
  high: sorted.length > 0 && sorted[sorted.length - 1] > high,
});

/** How many values lie in a range, and the lowest and highest of them - the true ones, past any clamp. */
export const summarize = (sorted: Sorted, [low, high]: ColorRange) => {
  const first = lowerBound(sorted, low);
  const end = upperBound(sorted, high);
  const count = end - first;
  return { count, lowest: count ? sorted[first] : null, highest: count ? sorted[end - 1] : null };
};

/** How many values lie beyond a range, and so take its end colors. */
export const countBeyond = (sorted: Sorted, [low, high]: ColorRange) =>
  lowerBound(sorted, low) + (sorted.length - upperBound(sorted, high));

/** A range as the legends write it: "±3.0" for a diverging scale, "0.5 – 120" otherwise. */
export const formatRange = (kind: RampKind, [low, high]: ColorRange, format: (value: number) => string) =>
  kind === "diverging" ? `±${format(high)}` : `${format(low)} – ${format(high)}`;

/** How much of the bar a sweep takes in: enough to catch a handful of values, narrow enough to separate colors. */
const RANGE_WIDTH = 0.15;

/**
 * The values past the clamp at one end - the ones drawn in that end's color - as a stretch of no
 * width at that end of the bar, which sweptValues opens out past it: [high, ∞) or (−∞, low].
 */
export const clampAt = (end: "low" | "high"): RampRange => (end === "low" ? { from: 0, to: 0 } : { from: 1, to: 1 });

/** Which end's clamp a stretch of the bar is, if it's one - see clampAt. */
export const clampOf = ({ from, to }: RampRange): "low" | "high" | null =>
  from !== to ? null : from === 0 ? "low" : from === 1 ? "high" : null;

/** The window centered on a place along the bar, slid inward at the ends rather than cut short. */
export const rangeAt = (t: number): RampRange => {
  const from = Math.min(Math.max(t - RANGE_WIDTH / 2, 0), 1 - RANGE_WIDTH);
  return { from, to: from + RANGE_WIDTH };
};

/** The middle 90%, 96% and 98% of the values, and all of them. */
export const percentilePresets = (sorted: Sorted): RangePreset[] => [
  { label: "5–95%", range: [percentile(sorted, 5), percentile(sorted, 95)] },
  { label: "2–98%", range: [percentile(sorted, 2), percentile(sorted, 98)] },
  { label: "1–99%", range: [percentile(sorted, 1), percentile(sorted, 99)] },
  { label: "All", range: [sorted[0], sorted[sorted.length - 1]] },
];

/** A symmetric limit, rounded up to a tenth, so "All" really takes in every value. */
export const reachOf = (sorted: Sorted) => Math.ceil(Math.max(-sorted[0], sorted[sorted.length - 1]) * 10) / 10;

/** ±2, ±3, ±5 and ±10 where the values reach past them, and all of them. */
export const symmetricPresets = (reach: number): RangePreset[] => [
  ...[2, 3, 5, 10]
    .filter((limit) => limit < reach)
    .map((limit): RangePreset => ({ label: `±${limit}`, range: [-limit, limit] })),
  { label: "All", range: [-reach, reach] },
];

/** Rounds a dragged diverging limit: tenths below 5, halves below 10, whole numbers beyond, as the tails move fast. */
export const snapLimit = (limit: number) =>
  limit < 5 ? Math.round(limit * 10) / 10 : limit < 10 ? Math.round(limit * 2) / 2 : Math.round(limit);

/** Whether two ranges match within half a percent of their span, so a range that's been rounded still matches. */
export const sameRange = (a: ColorRange, b: ColorRange) => {
  const tolerance = Math.max(Math.abs(a[1] - a[0]), Math.abs(b[1] - b[0])) * 5e-3;
  return Math.abs(a[0] - b[0]) <= tolerance && Math.abs(a[1] - b[1]) <= tolerance;
};

/** A ramp's color at any place along it, from 0 at its low end to 1 at its high end. */
export const rampAt = (stops: readonly RampStop[]) => {
  const parsed = stops.map(({ at, color }) => ({ at, color: rgb(color) }));
  return (s: number): string => {
    const t = clamp01(s);
    // The stops may be unevenly placed, so find the pair t falls between rather than indexing by step.
    const next = parsed.findIndex(({ at }) => at >= t);
    const upper = next === -1 ? parsed.length - 1 : Math.max(next, 1);
    const [from, to] = [parsed[upper - 1], parsed[upper]];
    const mix = to.at > from.at ? clamp01((t - from.at) / (to.at - from.at)) : 0;
    const channel = (key: "r" | "g" | "b") => Math.round(from.color[key] + (to.color[key] - from.color[key]) * mix);
    return `rgb(${channel("r")},${channel("g")},${channel("b")})`;
  };
};

/**
 * The color a value takes on a ramp whose colors span `range`, with values beyond held at the end
 * colors: what to paint a point so it matches a colorbar of the same stops and range.
 */
export const rampColor = (stops: readonly RampStop[], range: ColorRange) => {
  const at = rampAt(stops);
  const { toT } = rangeAxis(range);
  return (value: number) => at(toT(value));
};

/** A count as a share of a total, never rounded to zero ("<0.1%"). Tenths below 10%, whole percents above. */
export const formatShare = (count: number, total: number) => {
  const share = (100 * count) / Math.max(total, 1);
  return count === 0 ? "0%" : share < 0.1 ? "<0.1%" : `${share.toFixed(share < 10 ? 1 : 0)}%`;
};

/**
 * A sweep's tooltip: "12 samples (3.4%) · 0.2 – 1.5", the true lowest and highest values inside. A
 * clamp's reads "up to 113M" instead, leaving its near end to the end label.
 */
export const describeSweep = (
  values: ArrayLike<number>,
  range: ColorRange,
  sweep: RampRange,
  noun: string,
  formatValue: (value: number) => string
) => {
  const inside = summarize(values, sweptValues(range, sweep));
  if (inside.count === 0) return `No ${noun}s here`;
  const [lowest, highest] = [formatValue(inside.lowest!), formatValue(inside.highest!)];
  const clamp = clampOf(sweep);
  const reach =
    clamp === "high"
      ? `up to ${highest}`
      : clamp === "low"
        ? `down to ${lowest}`
        : lowest === highest
          ? lowest
          : `${lowest} – ${highest}`;
  return (
    `${inside.count.toLocaleString("en-US")} ${noun}${inside.count === 1 ? "" : "s"}` +
    ` (${formatShare(inside.count, values.length)}) · ${reach}`
  );
};

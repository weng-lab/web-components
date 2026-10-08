/** Seeded example data for the legend stories, so they render the same on every run. */

import { evenStops, type RampStop } from "../colorbarAxis";

/** A linear congruential generator: deterministic, and plenty random for example data. */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
};

/** A standard normal draw, by Box-Muller. */
const normal = (random: () => number) => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());

const sorted = (values: number[]) => Float64Array.from(values).sort();

const readsRandom = seeded(7);
/** Reads per sample: log-normal around 30M, with a long right tail. */
export const READS = sorted(Array.from({ length: 480 }, () => Math.exp(Math.log(30e6) + 0.35 * normal(readsRandom))));

export const formatReads = (value: number) => `${(value / 1e6).toFixed(1)}M`;

const zRandom = seeded(11);
/** Z-scores across a grid of cells, with a few outliers far past ±3. */
export const Z_SCORES = sorted([
  ...Array.from({ length: 4000 }, () => normal(zRandom)),
  ...Array.from({ length: 40 }, () => 3 + 6 * zRandom()),
  ...Array.from({ length: 25 }, () => -3 - 4 * zRandom()),
]);

export const formatZ = (z: number) => (z === 0 ? "0" : z.toFixed(1).replace("-", "−"));

export const VIRIDIS: RampStop[] = evenStops(["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"]);
export const RED_BLUE: RampStop[] = evenStops(["#2166ac", "#67a9cf", "#f7f7f7", "#ef8a62", "#b2182b"]);

/** The neutral for values with nothing to color by. */
export const MISSING_COLOR = "#bdbdbd";

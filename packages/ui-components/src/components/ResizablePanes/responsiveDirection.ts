import type { Breakpoint } from "@mui/material";
import type { Direction, ResponsiveDirection } from "./types";

/** Breakpoints in ascending order, matching MUI's cascade (each applies from its key upward). */
const BREAKPOINTS = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * Normalize a {@link ResponsiveDirection} into a breakpoint→{@link Direction} map
 * with `xs` always defined, so the value can compile to `@media` rules that have
 * a base case at the smallest viewport.
 *
 * A string becomes `{ xs: direction }`. A sparse map (e.g. `{ md: "row" }`) is
 * back-filled at `xs` with the lowest defined breakpoint's direction, which is
 * what MUI's cascade would otherwise leave undefined below that breakpoint.
 */
export function normalizeDirection(direction: ResponsiveDirection): Partial<Record<Breakpoint, Direction>> {
  const map = typeof direction === "string" ? { xs: direction } : { ...direction };
  if (!map.xs) {
    const lowest = BREAKPOINTS.find((bp) => map[bp]);
    map.xs = lowest ? map[lowest] : "row";
  }
  return map;
}

/**
 * Map each defined breakpoint's {@link Direction} through `fn`, producing a
 * responsive `sx` value (a breakpoint→value object). MUI's `sx` breakpoint
 * cascade then compiles this to `@media` rules — the browser picks the correct
 * value at paint time, before any JS runs, so orientation never flashes.
 */
export function perBreakpoint<T>(
  direction: ResponsiveDirection,
  fn: (d: Direction) => T
): Partial<Record<Breakpoint, T>> {
  const map = normalizeDirection(direction);
  return Object.fromEntries(
    (Object.entries(map) as [Breakpoint, Direction][]).map(([bp, d]) => [bp, fn(d)])
  );
}

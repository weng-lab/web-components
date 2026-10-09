import { Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useId, useState, type MouseEvent } from "react";
import {
  clampOf,
  describeSweep,
  histogram,
  rangeAt,
  rangeAxis,
  type ColorRange,
  type RampRange,
  type RampStop,
} from "../colorbarAxis";
import {
  BAR,
  GAP,
  HISTOGRAM,
  breakPoints,
  colorbarDepth,
  columnColor,
  histogramColumns,
  type ColorbarOrientation,
} from "../colorbarGeometry";
import { useSweep } from "./useSweep";

/** Pixels of bar per histogram column. */
const COLUMN = 5;

export type ColorbarGraphicProps = {
  orientation: ColorbarOrientation;
  /** The bar's length in pixels. */
  length: number;
  stops: readonly RampStop[];
  /** Where the colors stop. The bar spans it, and its end columns count the values beyond. */
  range: ColorRange;
  /** Every value on the plot, sorted ascending and unclamped: what the columns count. */
  values: ArrayLike<number>;
  /** How the sweep's tooltip writes values. */
  formatValue: (value: number) => string;
  /** What one value is, for the sweep's count: "sample", "cell". */
  noun: string;
  /**
   * The stretch of the bar under the cursor, drawn on it as a window - or an end's clamp (see
   * clampAt), drawn as a ring round that end's tip.
   */
  sweep: RampRange | null;
  /** Fired as the cursor moves along the bar and when it leaves, so the plot can highlight the window's values. */
  onSweep: (sweep: RampRange | null) => void;
  /** A value to mark on the bar - the hovered point's. */
  marker?: number | null;
  /** Where the sweep's tooltip portals to when the body won't do - see HeatmapLegendFrame. */
  overlayContainer?: HTMLElement;
};

/**
 * A colorbar with a histogram of the plot's values along it, as a `<g>` for the caller's `<svg>`, so
 * a heatmap can use it as its legend and downloads keep it.
 */
const ColorbarGraphic = ({
  orientation,
  length,
  stops,
  range,
  values,
  formatValue,
  noun,
  sweep,
  onSweep,
  marker = null,
  overlayContainer,
}: ColorbarGraphicProps) => {
  const theme = useTheme();
  const gradientId = `colorbar-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const horizontal = orientation === "horizontal";
  const depth = HISTOGRAM[orientation];
  const axis = rangeAxis(range);
  const fill = columnColor(theme);

  const bins = Math.max(8, Math.round(length / COLUMN));
  const columns = histogramColumns(histogram(values, axis, bins), depth);

  // Placed along the bar (t from 0 at its low end) and across it. The histogram sits above a
  // horizontal bar, and right of a vertical one, whose low end is at the bottom.
  const barAcross: [number, number] = horizontal ? [depth + GAP, depth + GAP + BAR] : [0, BAR];
  const box = (t0: number, t1: number, [a0, a1]: [number, number]) =>
    horizontal
      ? { x: t0 * length, y: a0, width: (t1 - t0) * length, height: a1 - a0 }
      : { x: a0, y: length - t1 * length, width: a1 - a0, height: (t1 - t0) * length };
  // A column's extent across the bar, growing away from it.
  const columnAcross = (size: number): [number, number] =>
    horizontal ? [depth - size, depth] : [BAR + GAP, BAR + GAP + size];
  // A point given along the bar in pixels and across it, placed on screen.
  const point = (along: number, across: number): [number, number] =>
    horizontal ? [along, across] : [across, length - along];
  const around = (pad: number): [number, number] => [barAcross[0] - pad, barAcross[1] + pad];

  // A clamp rings the rounded tip at its end; a window frames its stretch of the bar.
  const clamp = sweep && clampOf(sweep);
  const frame = !sweep
    ? null
    : clamp
      ? {
          ...box(
            clamp === "low" ? -3 / length : 1 - (BAR + 3) / length,
            clamp === "low" ? (BAR + 3) / length : 1 + 3 / length,
            around(3)
          ),
          rx: BAR / 2 + 3,
        }
      : { ...box(sweep.from, sweep.to, around(3)), rx: 3 };

  // Whether the cursor is on the bar: a sweep can also come from an end label, which shows its own count.
  const [over, setOver] = useState(false);
  const sweepTo = useSweep(onSweep);

  const handleMove = (event: MouseEvent<SVGRectElement>) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    setOver(true);
    sweepTo(rangeAt(horizontal ? (event.clientX - left) / width : 1 - (event.clientY - top) / height));
  };
  const handleLeave = () => {
    setOver(false);
    sweepTo(null);
  };

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0" y1={horizontal ? "0" : "1"} x2={horizontal ? "1" : "0"} y2="0">
          {stops.map(({ at, color }) => (
            <stop key={at} offset={`${at * 100}%`} stopColor={color} />
          ))}
        </linearGradient>
      </defs>

      {columns.map(({ count, size, capped }, k) => {
        if (count === 0) return null;
        // A pixel between columns, taken off each column's high side.
        const t0 = k / bins;
        const t1 = (k + 1) / bins - 1 / length;
        return (
          <g key={k}>
            <rect {...box(t0, t1, columnAcross(size))} fill={fill} />
            {capped && (
              <polygon
                // Half a pixel past the column's sides, so no sliver is left either side.
                points={breakPoints(
                  // Lying down, a column grows up the screen, where y falls; standing up, it grows rightward.
                  (across, up) => point(across, horizontal ? depth - up : BAR + GAP + up),
                  { from: t0 * length - 0.5, to: t1 * length + 0.5, at: depth / 2, rise: 3, gap: 2 }
                )}
                fill={theme.palette.background.paper}
              />
            )}
          </g>
        );
      })}

      <rect {...box(0, 1, barAcross)} rx={BAR / 2} fill={`url(#${gradientId})`} />

      {frame && (
        // Paper-colored inside and out, so the frame holds against the dark and pale ends alike.
        <g fill="none">
          <rect {...frame} stroke={theme.palette.background.paper} strokeWidth={4} />
          <rect {...frame} stroke={theme.palette.text.primary} strokeWidth={2} />
        </g>
      )}

      {marker !== null && (
        <rect
          {...box(axis.toT(marker) - 1.5 / length, axis.toT(marker) + 1.5 / length, around(4))}
          rx={1.5}
          fill={theme.palette.text.primary}
          stroke={theme.palette.background.paper}
          strokeWidth={1}
        />
      )}

      {/* The hit area runs past the bar on both sides, so a sweep that drifts off it doesn't drop the highlight. */}
      <Tooltip
        title={over && sweep ? describeSweep(values, range, sweep, noun, formatValue) : ""}
        open={over && sweep !== null}
        followCursor
        placement={horizontal ? "top" : "right"}
        disableInteractive
        slotProps={{ popper: { container: overlayContainer } }}
      >
        <rect
          {...box(0, 1, [-4, colorbarDepth(orientation) + 4])}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        />
      </Tooltip>
    </g>
  );
};

export default ColorbarGraphic;

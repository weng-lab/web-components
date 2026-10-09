import { Box, Slider, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useId } from "react";
import {
  countBeyond,
  formatRange,
  formatShare,
  histogram,
  percentilePresets,
  rampAt,
  reachOf,
  sameRange,
  snapLimit,
  squeezedAxis,
  symmetricPresets,
  type ColorRange,
  type RampKind,
  type RampStop,
  type RangePreset,
} from "../colorbarAxis";
import { breakPoints, columnColor, histogramColumns } from "../colorbarGeometry";

/** The editor's own sizes, roomier than the compact colorbar's. */
const WIDTH = 348;
const EDITOR_HISTOGRAM = 56;
const EDITOR_GAP = 3;
const EDITOR_BAR = 12;
/** Pixels of bar per histogram column: wider than the compact legend's, for a steadier shape. */
const COLUMN = 7;
/** Samples of the bar's color per pixel: fine enough that the squeezed tails don't band. */
const COLOR_STEP = 3;

export type ColorRangeEditorProps = {
  stops: readonly RampStop[];
  kind: RampKind;
  /** Where the colors stop now. */
  range: ColorRange;
  /** The default range, which the editor's axis is built around. */
  defaultRange: ColorRange;
  /** The lowest and highest value there is, which the editor's bar reaches. The ends of `values` by default. */
  extent?: ColorRange;
  /** Every value on the plot, sorted ascending and unclamped: what the columns count. */
  values: ArrayLike<number>;
  /** Ranges offered in one click: ±2, ±3, ±5, ±10 for a diverging scale, the middle 90–98% otherwise. */
  presets?: RangePreset[];
  format: (value: number) => string;
  /** What one value is, for the count beyond: "sample", "cell". */
  noun: string;
  /** Fired on every step of a drag, so the plot recolors as a handle moves, and for a preset. */
  onChange: (range: ColorRange) => void;
};

/**
 * Sets where a plot's colors stop, by dragging a handle or picking a preset. The bar spans every
 * value, with the tails squeezed (see squeezedAxis); beyond the handles it runs flat in the end
 * colors, and the columns there fade.
 */
const ColorRangeEditor = ({
  stops,
  kind,
  range,
  defaultRange,
  values,
  // Defaulted after `values`, which they read.
  extent = [values[0], values[values.length - 1]],
  presets = kind === "diverging" ? symmetricPresets(reachOf(values)) : percentilePresets(values),
  format,
  noun,
  onChange,
}: ColorRangeEditorProps) => {
  const theme = useTheme();
  const gradientId = `range-editor-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const axis = squeezedAxis(defaultRange, extent, kind);
  const [low, high] = range;
  const [lowT, highT] = [axis.toT(low), axis.toT(high)];
  const span = high - low;

  const bins = Math.round(WIDTH / COLUMN);
  const columns = histogramColumns(histogram(values, axis, bins), EDITOR_HISTOGRAM);
  const column = WIDTH / bins;

  // Sampled, since a gradient between the ramp's stops can't follow the squeezed axis or the flat ends.
  const colorAt = rampAt(stops);
  const barStops = Array.from({ length: Math.ceil(WIDTH / COLOR_STEP) + 1 }, (_, i) => {
    const t = Math.min((i * COLOR_STEP) / WIDTH, 1);
    return { t, color: colorAt(span > 0 ? (axis.fromT(t) - low) / span : 0.5) };
  });

  const beyond = countBeyond(values, range);

  const handleChange = (thumbs: number[], active: number) => {
    const dragged = axis.fromT(thumbs[active]);
    if (kind === "diverging") {
      const limit = Math.min(Math.max(snapLimit(Math.abs(dragged)), 0.5), Math.max(-extent[0], extent[1]));
      onChange([-limit, limit]);
      return;
    }
    // Kept a sliver apart, so the range can't collapse.
    const minimumSpan = (extent[1] - extent[0]) / 200;
    onChange(
      active === 0 ? [Math.min(dragged, high - minimumSpan), high] : [low, Math.max(dragged, low + minimumSpan)]
    );
  };

  const presetValue = presets.find((preset) => sameRange(preset.range, range))?.label ?? null;

  return (
    // As wide as the bar, so a long readout wraps rather than widening the panel mid-drag.
    <Stack gap={1} width={WIDTH}>
      <Box position="relative" width={WIDTH} height={EDITOR_HISTOGRAM + EDITOR_GAP + EDITOR_BAR}>
        <svg
          width={WIDTH}
          height={EDITOR_HISTOGRAM + EDITOR_GAP + EDITOR_BAR}
          style={{ display: "block", overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId}>
              {barStops.map(({ t, color }) => (
                <stop key={t} offset={`${t * 100}%`} stopColor={color} />
              ))}
            </linearGradient>
          </defs>
          {columns.map(({ count, size, capped }, k) => {
            if (count === 0) return null;
            const center = (k + 0.5) / bins;
            return (
              <g key={k} opacity={center < lowT || center > highT ? 0.35 : 1}>
                <rect
                  x={k * column}
                  y={EDITOR_HISTOGRAM - size}
                  width={column - 1}
                  height={size}
                  fill={columnColor(theme)}
                />
                {capped && (
                  <polygon
                    points={breakPoints((across, up) => [across, EDITOR_HISTOGRAM - up], {
                      from: k * column - 0.5,
                      to: (k + 1) * column - 0.5,
                      at: EDITOR_HISTOGRAM / 2,
                      rise: 5,
                      gap: 3,
                    })}
                    fill={theme.palette.background.paper}
                  />
                )}
              </g>
            );
          })}
          <rect
            x={0}
            y={EDITOR_HISTOGRAM + EDITOR_GAP}
            width={WIDTH}
            height={EDITOR_BAR}
            rx={EDITOR_BAR / 2}
            fill={`url(#${gradientId})`}
          />
          {/* Where the axis changes pace, from linear to squeezed. */}
          {axis.breaks.map((b) => (
            <rect
              key={b}
              x={b * WIDTH - 1}
              y={EDITOR_HISTOGRAM + EDITOR_GAP}
              width={2}
              height={EDITOR_BAR}
              fill={theme.palette.background.paper}
            />
          ))}
          {[lowT, highT].map((t, i) => (
            <rect
              key={i}
              x={t * WIDTH - 0.5}
              y={0}
              width={1}
              height={EDITOR_HISTOGRAM + EDITOR_GAP}
              fill={theme.palette.text.secondary}
            />
          ))}
        </svg>
        <Slider
          value={[lowT, highT]}
          min={0}
          max={1}
          step={0.002}
          disableSwap
          scale={(t) => axis.fromT(t)}
          valueLabelDisplay="auto"
          // Both are handed the scaled value, so they take it as it is.
          valueLabelFormat={format}
          getAriaLabel={(i) =>
            i === 0 ? "Where the colors stop at the low end" : "Where the colors stop at the high end"
          }
          getAriaValueText={format}
          onChange={(_, value, active) => handleChange(value as number[], active)}
          sx={{
            position: "absolute",
            left: 0,
            top: EDITOR_HISTOGRAM + EDITOR_GAP,
            width: WIDTH,
            height: EDITOR_BAR,
            p: 0,
            "@media (pointer: coarse)": { p: 0 },
            "& .MuiSlider-rail, & .MuiSlider-track": { opacity: 0, border: 0 },
            "& .MuiSlider-thumb": {
              width: 6,
              height: EDITOR_BAR + 10,
              borderRadius: "3px",
              bgcolor: "text.primary",
              boxShadow: `0 0 0 1px ${theme.palette.background.paper}`,
              "&::before": { boxShadow: "none" },
              "&:hover, &.Mui-focusVisible, &.Mui-active": {
                boxShadow: `0 0 0 1px ${theme.palette.background.paper}, 0 0 0 5px rgba(0, 0, 0, 0.12)`,
              },
            },
          }}
        />
      </Box>
      <Box position="relative" height={16}>
        <Typography variant="caption" color="text.secondary" position="absolute" left={0} top={-2}>
          {format(axis.fromT(0))}
        </Typography>
        {kind === "diverging" && (
          <Typography
            variant="caption"
            color="text.secondary"
            position="absolute"
            left={`${axis.toT(0) * 100}%`}
            top={-2}
            sx={{ transform: "translateX(-50%)" }}
          >
            0
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" position="absolute" right={0} top={-2}>
          {format(axis.fromT(1))}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" component="p">
        Colors span{" "}
        <Box component="strong" color="text.primary">
          {formatRange(kind, range, format)}
        </Box>
        ; {beyond.toLocaleString("en-US")} {noun}
        {beyond === 1 ? "" : "s"} ({formatShare(beyond, values.length)}) lie beyond and take the end colors.
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={presetValue}
        onChange={(_, label: string | null) => {
          const preset = presets.find((p) => p.label === label);
          if (preset) onChange(preset.range);
        }}
        aria-label="Color range presets"
      >
        {presets.map(({ label }) => (
          <ToggleButton key={label} value={label} sx={{ py: 0.25, px: 1.25, textTransform: "none" }}>
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
};

export default ColorRangeEditor;

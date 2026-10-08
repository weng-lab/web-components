import { Box, Slider, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useId } from "react";
import {
  colorAt,
  countBeyond,
  formatRange,
  formatShare,
  histogram,
  sameRange,
  snapLimit,
  squeezedAxis,
  type ColorRange,
  type RampKind,
  type RampStop,
  type RangePreset,
} from "./colorbarAxis";
import { breakPoints, columnColor } from "./colorbarGeometry";

const WIDTH = 348;
const HISTOGRAM = 56;
const GAP = 3;
const BAR = 12;
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
  /** The lowest and highest value there is, which the editor's bar reaches. */
  extent: ColorRange;
  /** Every value on the plot, sorted ascending and unclamped: what the columns count. */
  values: ArrayLike<number>;
  presets: RangePreset[];
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
  extent,
  values,
  presets,
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
  const counts = histogram(values, axis, bins);
  // Scaled as ColorbarGraphic scales its columns.
  const tallest = Math.max(1, ...counts.slice(1, -1));
  const column = WIDTH / bins;

  // Sampled, since a gradient between the ramp's stops can't follow the squeezed axis or the flat ends.
  const barStops = Array.from({ length: Math.ceil(WIDTH / COLOR_STEP) + 1 }, (_, i) => {
    const t = Math.min((i * COLOR_STEP) / WIDTH, 1);
    return { t, color: colorAt(stops, span > 0 ? (axis.fromT(t) - low) / span : 0.5) };
  });

  const beyond = countBeyond(values, range);

  const handleChange = (values: number[], active: number) => {
    const dragged = axis.fromT(values[active]);
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
      <Box position="relative" width={WIDTH} height={HISTOGRAM + GAP + BAR}>
        <svg width={WIDTH} height={HISTOGRAM + GAP + BAR} style={{ display: "block", overflow: "visible" }} aria-hidden>
          <defs>
            <linearGradient id={gradientId}>
              {barStops.map(({ t, color }) => (
                <stop key={t} offset={`${t * 100}%`} stopColor={color} />
              ))}
            </linearGradient>
          </defs>
          {counts.map((count, k) => {
            if (count === 0) return null;
            const share = count / tallest;
            const size = Math.max(1, Math.min(share, 1) * HISTOGRAM);
            const center = (k + 0.5) / bins;
            return (
              <g key={k} opacity={center < lowT || center > highT ? 0.35 : 1}>
                <rect x={k * column} y={HISTOGRAM - size} width={column - 1} height={size} fill={columnColor(theme)} />
                {share > 1 && (
                  <polygon
                    points={breakPoints((across, up) => [across, HISTOGRAM - up], {
                      from: k * column - 0.5,
                      to: (k + 1) * column - 0.5,
                      at: HISTOGRAM / 2,
                      rise: 5,
                      gap: 3,
                    })}
                    fill={theme.palette.background.paper}
                  />
                )}
              </g>
            );
          })}
          <rect x={0} y={HISTOGRAM + GAP} width={WIDTH} height={BAR} rx={BAR / 2} fill={`url(#${gradientId})`} />
          {/* Where the axis changes pace, from linear to squeezed. */}
          {axis.breaks.map((b) => (
            <rect
              key={b}
              x={b * WIDTH - 1}
              y={HISTOGRAM + GAP}
              width={2}
              height={BAR}
              fill={theme.palette.background.paper}
            />
          ))}
          {[lowT, highT].map((t, i) => (
            <rect
              key={i}
              x={t * WIDTH - 0.5}
              y={0}
              width={1}
              height={HISTOGRAM + GAP}
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
          valueLabelFormat={(value) => format(value)}
          getAriaLabel={(i) =>
            i === 0 ? "Where the colors stop at the low end" : "Where the colors stop at the high end"
          }
          getAriaValueText={(t) => format(axis.fromT(t))}
          onChange={(_, value, active) => handleChange(value as number[], active)}
          sx={{
            position: "absolute",
            left: 0,
            top: HISTOGRAM + GAP,
            width: WIDTH,
            height: BAR,
            p: 0,
            "@media (pointer: coarse)": { p: 0 },
            "& .MuiSlider-rail, & .MuiSlider-track": { opacity: 0, border: 0 },
            "& .MuiSlider-thumb": {
              width: 6,
              height: BAR + 10,
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

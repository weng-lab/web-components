import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { InlineColorbar, type ColorbarScaleProps } from "./Colorbar";
import ColorRangeButton, { type ColorRangeControl } from "../ColorRange/ColorRangeButton";
import { rampAt, type ColorRange, type RampKind } from "../colorbarAxis";
import { themeLabelStyle, type ColorbarLabelStyle } from "./colorbarLabels";
import Swatch from "../Swatch";

export type ColorbarLegendProps = Omit<
  ColorbarScaleProps,
  "range" | "labelStyle" | "holdLabels" | "overlayContainer"
> & {
  /** What the colors stand for, for screen readers. */
  label: string;
  /** Where the colors stop. Null while no value on the plot has one, leaving only the missing count. */
  range: ColorRange | null;
  kind?: RampKind;
  /** Where the colors stop can be moved, from a button beside the bar. Omitted, it can't. */
  control?: ColorRangeControl;
  /** What the range panel says about the scale - see ColorRangeButton. */
  notes?: readonly string[];
  /**
   * How many values on screen are drawn in a neutral rather than on the ramp, the neutral, and what it
   * stands for: "No value" by default, or a cutoff the ramp starts at, say.
   */
  missing?: { count: number; color: string; label?: string };
  /** The bar's length: by default a chip row's worth of room, lying down. */
  length?: number;
  /** How the end labels are written. The theme's caption by default - see themeLabelStyle. */
  labelStyle?: ColorbarLabelStyle;
};

/**
 * A colorbar in place of a field's chips, held to their height so switching doesn't shift the plot,
 * with the button that moves its range and a count of the values with none.
 */
const ColorbarLegend = ({
  label,
  range,
  kind = "sequential",
  control,
  notes,
  missing,
  length = 160,
  labelStyle,
  ...scale
}: ColorbarLegendProps) => {
  const theme = useTheme();
  // While the range editor is open, the end labels hold their width - see useEndLabels.
  const [editing, setEditing] = useState(false);

  return (
    <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={2} rowGap={0.5} minHeight={24} flexShrink={0}>
      {range &&
        // Every value is the same, so there's no range for a bar to show.
        (range[0] === range[1] ? (
          <Stack direction="row" alignItems="center" gap={0.75}>
            <Swatch color={rampAt(scale.stops)(0.5)} />
            <Typography variant="caption">
              {scale.format(range[0])} in every {scale.noun}
            </Typography>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" gap={0.5}>
            <InlineColorbar
              {...scale}
              label={label}
              range={range}
              length={length}
              labelStyle={labelStyle ?? themeLabelStyle(theme)}
              holdLabels={editing}
            />
            {control && (
              <ColorRangeButton
                stops={scale.stops}
                kind={kind}
                range={range}
                values={scale.values}
                format={scale.format}
                noun={scale.noun}
                notes={notes}
                {...control}
                onOpen={() => setEditing(true)}
                onClose={() => {
                  setEditing(false);
                  control.onClose?.();
                }}
              />
            )}
          </Stack>
        ))}
      {missing && missing.count > 0 && (
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Swatch color={missing.color} />
          <Typography variant="caption">{missing.label ?? "No value"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {missing.count}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default ColorbarLegend;

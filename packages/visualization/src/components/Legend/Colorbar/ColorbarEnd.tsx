import { Tooltip, type TooltipProps } from "@mui/material";
import { useState, type ReactElement } from "react";
import { clampAt, describeSweep, rangeAt, type ColorRange, type RampRange } from "../colorbarAxis";
import { useSweep } from "./useSweep";

export type ColorbarEndProps = {
  end: "low" | "high";
  /** Whether values lie past this end, so the label reads "≤" or "≥". */
  clamped: boolean;
  /** The label, as an element a tooltip can anchor to: a `<text>` in an `<svg>`, a Typography beside one. */
  children: ReactElement;
  /** The colorbar's range, values, noun and value format - see ColorbarGraphic. */
  range: ColorRange;
  values: ArrayLike<number>;
  noun: string;
  formatValue: (value: number) => string;
  onSweep: (sweep: RampRange | null) => void;
  placement: TooltipProps["placement"];
  /** Where the tooltip portals to when the body won't do - see HeatmapLegendFrame. */
  overlayContainer?: HTMLElement;
};

/**
 * One of a colorbar's end labels, which sweeps its end when hovered: a "≤" or "≥" label the values
 * past the clamp, a plain one the last stretch of the bar.
 */
const ColorbarEnd = ({
  end,
  clamped,
  children,
  range,
  values,
  noun,
  formatValue,
  onSweep,
  placement,
  overlayContainer,
}: ColorbarEndProps) => {
  const endWindow = clamped ? clampAt(end) : rangeAt(end === "low" ? 0 : 1);
  const [hovered, setHovered] = useState(false);
  const sweepTo = useSweep(onSweep);

  return (
    <Tooltip
      title={hovered ? describeSweep(values, range, endWindow, noun, formatValue) : ""}
      open={hovered}
      onOpen={() => {
        setHovered(true);
        sweepTo(endWindow);
      }}
      onClose={() => {
        setHovered(false);
        sweepTo(null);
      }}
      // At once, as the bar's own sweep is.
      enterDelay={0}
      placement={placement}
      disableInteractive
      slotProps={{ popper: { container: overlayContainer } }}
    >
      {children}
    </Tooltip>
  );
};

export default ColorbarEnd;

import { Tooltip, type TooltipProps } from "@mui/material";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { clampAt, describeSweep, rangeAt, type ColorRange, type RampRange } from "./colorbarAxis";

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
 * One of a colorbar's end labels, which highlights what it names when hovered. A "≤" or "≥" label
 * names the values past the clamp - every one drawn in the end color, and only those - with the
 * bar's tip ringed. A plain one names no clamp, only where the bar ends, so it sweeps that end as
 * the bar's own last pixels do: no values need lie exactly at an end the reader set.
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

  // The label can unmount mid-hover (Escape closing the expanded minimap) with no mouseleave, so
  // unmounting ends its sweep too, as ColorbarGraphic's does.
  const hoveredRef = useRef(false);
  const onSweepRef = useRef(onSweep);
  useEffect(() => {
    hoveredRef.current = hovered;
    onSweepRef.current = onSweep;
  });
  useEffect(
    () => () => {
      if (hoveredRef.current) onSweepRef.current(null);
    },
    []
  );

  return (
    <Tooltip
      title={describeSweep(values, range, endWindow, noun, formatValue)}
      open={hovered}
      onOpen={() => {
        setHovered(true);
        onSweep(endWindow);
      }}
      onClose={() => {
        setHovered(false);
        onSweep(null);
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

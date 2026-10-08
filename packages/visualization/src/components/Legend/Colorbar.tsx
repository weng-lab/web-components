import type { TooltipProps } from "@mui/material";
import ColorbarEnd from "./ColorbarEnd";
import ColorbarGraphic from "./ColorbarGraphic";
import type { ColorRange, RampRange, RampStop } from "./colorbarAxis";
import { LABEL_GAP, colorbarDepth, labelSpace, type ColorbarOrientation } from "./colorbarGeometry";
import { DEFAULT_LABEL_STYLE, useEndLabels, type ColorbarLabelStyle, type EndLabel } from "./colorbarLabels";

/** What a colorbar shows and how it's swept, however it's laid out. */
export type ColorbarScaleProps = {
  stops: readonly RampStop[];
  /** Where the colors stop. The bar spans it, and the end labels name its ends. */
  range: ColorRange;
  /**
   * Every value on screen, sorted ascending and unclamped: what the histogram counts, and whether an
   * end label reads "≤" or "≥".
   */
  values: ArrayLike<number>;
  /** How the end labels write the range. */
  format: (value: number) => string;
  /** How a sweep's tooltip writes real values, which can want more precision than the ends; `format` otherwise. */
  formatValue?: (value: number) => string;
  /** What one value is, for counts: "sample", "cell". */
  noun: string;
  /** The stretch of the bar under the cursor, or an end's clamp - see ColorbarGraphic. */
  sweep: RampRange | null;
  /** Fired as the cursor moves along the bar or onto an end label, and as it leaves, so the plot can highlight what's inside. */
  onSweep: (sweep: RampRange | null) => void;
  /** A value to mark on the bar - the hovered point's. */
  marker?: number | null;
  /** How the end labels are written. The library's axis text by default. */
  labelStyle?: ColorbarLabelStyle;
  /** While true, the end labels keep their widest width, so the bar holds still as its range is dragged. */
  holdLabels?: boolean;
  /** Where tooltips portal to when the body won't do - see HeatmapLegendFrame. */
  overlayContainer?: HTMLElement;
};

/** A colorbar's props once its labels are measured and its bar's length is known. */
type LaidOut = Omit<ColorbarScaleProps, "labelStyle" | "holdLabels"> & {
  labelStyle: ColorbarLabelStyle;
  labels: { low: EndLabel; high: EndLabel };
  length: number;
};

type EndTextProps = {
  end: "low" | "high";
  /** Where the text is anchored. */
  x: number;
  y: number;
  anchor: "start" | "end";
  placement: TooltipProps["placement"];
  bar: LaidOut;
};

/**
 * One end label, which highlights what it names when hovered - see ColorbarEnd. Focusable, so the
 * ends can be reached from the keyboard as the bar can't be.
 */
const EndText = ({ end, x, y, anchor, placement, bar }: EndTextProps) => {
  const { fontFamily, fontSize, fontWeight, letterSpacing, fill } = bar.labelStyle;
  return (
    <ColorbarEnd
      end={end}
      clamped={bar.labels[end].clamped}
      range={bar.range}
      values={bar.values}
      noun={bar.noun}
      formatValue={bar.formatValue ?? bar.format}
      onSweep={bar.onSweep}
      placement={placement}
      overlayContainer={bar.overlayContainer}
    >
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fontFamily={fontFamily}
        fontSize={fontSize}
        fontWeight={fontWeight}
        letterSpacing={letterSpacing}
        fill={fill}
        tabIndex={0}
        style={{ cursor: "default" }}
      >
        {bar.labels[end].text}
      </text>
    </ColorbarEnd>
  );
};

const Graphic = ({ orientation, bar }: { orientation: ColorbarOrientation; bar: LaidOut }) => (
  <ColorbarGraphic
    orientation={orientation}
    length={bar.length}
    stops={bar.stops}
    range={bar.range}
    values={bar.values}
    format={bar.format}
    formatValue={bar.formatValue}
    noun={bar.noun}
    sweep={bar.sweep}
    onSweep={bar.onSweep}
    marker={bar.marker}
    overlayContainer={bar.overlayContainer}
  />
);

/** Lying down: the end labels either side of the bar, sitting on its bottom edge. */
const ColorbarRow = (bar: LaidOut) => {
  const depth = colorbarDepth("horizontal");
  const barStart = bar.labels.low.width + LABEL_GAP;
  return (
    <g>
      <EndText end="low" x={bar.labels.low.width} y={depth} anchor="end" placement="top" bar={bar} />
      <g transform={`translate(${barStart},0)`}>
        <Graphic orientation="horizontal" bar={bar} />
      </g>
      <EndText end="high" x={barStart + bar.length + LABEL_GAP} y={depth} anchor="start" placement="top" bar={bar} />
    </g>
  );
};

/** Standing up: the high end's label above the bar and the low end's below. */
const ColorbarColumn = (bar: LaidOut) => {
  const space = labelSpace(bar.labelStyle.fontSize);
  const lowBaseline = space + bar.length + bar.labelStyle.fontSize + 3;
  return (
    <g>
      <EndText end="high" x={0} y={space - 6} anchor="start" placement="left" bar={bar} />
      <g transform={`translate(0,${space})`}>
        <Graphic orientation="vertical" bar={bar} />
      </g>
      <EndText end="low" x={0} y={lowBaseline} anchor="start" placement="left" bar={bar} />
    </g>
  );
};

/** How wide a colorbar lying down is: its labels, the gaps beside them, and a bar `length` long. */
const rowWidth = ({ low, high }: LaidOut["labels"], length: number) =>
  low.width + LABEL_GAP + length + LABEL_GAP + high.width;

/** The shortest a bar gets, however little room its labels leave. */
const MIN_LENGTH = 40;

export type ColorbarProps = ColorbarScaleProps & {
  orientation: ColorbarOrientation;
  /** The box to fill, as a heatmap's legend slot gives it (HeatmapLegendFrame). The bar takes what its labels leave. */
  width: number;
  height: number;
};

/**
 * A colorbar with a histogram of the plot's values along it, filling a box in the caller's `<svg>`:
 * a plot's legend slot. Standing up, its labels go above and below the bar; lying down, either side.
 * SVG throughout, so a download keeps it.
 */
export const Colorbar = ({
  orientation,
  width,
  height,
  labelStyle = DEFAULT_LABEL_STYLE,
  holdLabels = false,
  ...scale
}: ColorbarProps) => {
  const labels = useEndLabels(scale.range, scale.values, scale.format, labelStyle, holdLabels);

  if (orientation === "vertical") {
    const length = Math.max(height - 2 * labelSpace(labelStyle.fontSize), MIN_LENGTH);
    return <ColorbarColumn {...scale} labelStyle={labelStyle} labels={labels} length={length} />;
  }
  const length = Math.max(width - rowWidth(labels, 0), MIN_LENGTH);
  return (
    <g transform={`translate(0,${(height - colorbarDepth("horizontal")) / 2})`}>
      <ColorbarRow {...scale} labelStyle={labelStyle} labels={labels} length={length} />
    </g>
  );
};

export type InlineColorbarProps = ColorbarScaleProps & {
  /** The bar's length. The colorbar is as wide as that and its labels. */
  length: number;
  /** What the colors stand for, for screen readers. */
  label: string;
};

/** A colorbar lying down in an `<svg>` of its own, sized to its bar and labels, for a page's own layout. */
export const InlineColorbar = ({
  length,
  label,
  labelStyle = DEFAULT_LABEL_STYLE,
  holdLabels = false,
  ...scale
}: InlineColorbarProps) => {
  const labels = useEndLabels(scale.range, scale.values, scale.format, labelStyle, holdLabels);
  const [low, high] = scale.range;
  return (
    <svg
      width={rowWidth(labels, length)}
      height={colorbarDepth("horizontal")}
      role="group"
      aria-label={`${label} color scale, from ${scale.format(low)} to ${scale.format(high)}`}
      style={{ display: "block", overflow: "visible", flexShrink: 0 }}
    >
      <ColorbarRow {...scale} labelStyle={labelStyle} labels={labels} length={length} />
    </svg>
  );
};

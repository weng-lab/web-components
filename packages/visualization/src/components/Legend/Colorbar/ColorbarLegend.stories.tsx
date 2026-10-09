import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { percentileRange, sweptValues, type ColorRange, type RampRange } from "../colorbarAxis";
import ColorbarLegend, { type ColorbarLegendProps } from "./ColorbarLegend";
import { MISSING_COLOR, READS, RED_BLUE, VIRIDIS, Z_SCORES, formatReads, formatZ } from "../example-data/legendData";

type StoryArgs = ColorbarLegendProps & {
  /** Whether the story wires up the range editor. */
  adjustable?: boolean;
};

/**
 * The legend with its sweep and range held in local state, as a page holds them. The line beneath
 * says what a sweep would highlight on the plot.
 */
const Stateful = ({ adjustable = true, ...args }: StoryArgs) => {
  const initialRange = args.range;
  const [range, setRange] = useState<ColorRange | null>(initialRange);
  const [sweep, setSweep] = useState<RampRange | null>(null);
  const within = range && sweep && sweptValues(range, sweep);
  const count = within ? Array.from(args.values).filter((v) => v >= within[0] && v <= within[1]).length : 0;

  return (
    <Stack gap={1.5}>
      <ColorbarLegend
        {...args}
        range={range}
        sweep={sweep}
        onSweep={setSweep}
        control={adjustable && initialRange ? { defaultRange: initialRange, onChange: setRange } : undefined}
      />
      <Typography variant="caption" color="text.secondary">
        {within ? `The plot would highlight ${count} ${args.noun}s.` : "Hover the bar or an end label to sweep it."}
      </Typography>
    </Stack>
  );
};

const meta = {
  title: "visualization/Legend/ColorbarLegend",
  component: ColorbarLegend,
  tags: ["autodocs"],
  args: {
    label: "Reads",
    stops: VIRIDIS,
    range: percentileRange(READS, 2),
    values: READS,
    format: formatReads,
    noun: "sample",
    sweep: null,
    onSweep: () => {},
  },
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof ColorbarLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A sequential scale starting at the middle 96% of values, so the ends read "≤" and "≥". The tune
 * button opens the range editor; values without one are counted beside the bar.
 */
export const Sequential: Story = {
  args: {
    notes: ["Starts at the middle 96% of samples, so a few extreme values don't wash out the rest."],
    missing: { count: 12, color: MISSING_COLOR },
  },
};

/** A diverging scale held symmetric around 0, with presets at ±2, ±3, ±5 and all. */
export const Diverging: Story = {
  args: {
    label: "Z-score",
    kind: "diverging",
    stops: RED_BLUE,
    range: [-3, 3],
    values: Z_SCORES,
    format: formatZ,
    noun: "cell",
  },
};

/** Without a range editor, the bar and its labels alone. */
export const ReadOnly: Story = {
  render: (args) => <Stateful {...args} adjustable={false} />,
};

/** Where every value is the same there's no range for a bar to show. */
export const EveryValueAlike: Story = {
  args: { range: [30e6, 30e6], values: Float64Array.from({ length: 20 }, () => 30e6) },
};

/** The end labels in the page's own type. */
export const CustomLabelStyle: Story = {
  args: { labelStyle: { fontFamily: "Georgia, serif", fontSize: 13, fill: "#1f2937" }, length: 220 },
};

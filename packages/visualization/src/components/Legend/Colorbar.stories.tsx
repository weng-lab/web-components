import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { RampRange } from "./colorbarAxis";
import { Colorbar, type ColorbarProps } from "./Colorbar";
import { RED_BLUE, Z_SCORES, formatZ } from "./example-data/legendData";

/**
 * The colorbar in an `<svg>` the size of the box it's given, as a heatmap's legend slot gives it,
 * with its sweep in local state.
 */
const InSvg = (args: ColorbarProps) => {
  const [sweep, setSweep] = useState<RampRange | null>(null);
  return (
    <svg width={args.width} height={args.height} style={{ overflow: "visible" }}>
      <Colorbar {...args} sweep={sweep} onSweep={setSweep} />
    </svg>
  );
};

const meta = {
  title: "visualization/Legend/Colorbar",
  component: Colorbar,
  tags: ["autodocs"],
  args: {
    orientation: "vertical",
    width: 64,
    height: 360,
    stops: RED_BLUE,
    range: [-3, 3],
    values: Z_SCORES,
    format: formatZ,
    noun: "cell",
    sweep: null,
    onSweep: () => {},
  },
  render: (args) => <InSvg {...args} />,
} satisfies Meta<typeof Colorbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Standing beside a plot: the labels above and below the bar, the histogram to its right. */
export const Standing: Story = {};

/** Lying down across a box: the labels either side, and the bar takes the room they leave. */
export const Lying: Story = {
  args: { orientation: "horizontal", width: 480, height: 40 },
};

/** A value marked on the bar, as a hovered cell's would be. */
export const WithMarker: Story = {
  args: { marker: 1.4 },
};

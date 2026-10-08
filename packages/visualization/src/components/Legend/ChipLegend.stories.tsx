import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { POINT_SHAPES } from "../ScatterPlot/types";
import ChipLegend, { type ChipLegendProps, type LegendGroup } from "./ChipLegend";

const GROUPS: LegendGroup[] = [
  { value: "case", label: "Case", color: "#e41a1c", count: 412 },
  { value: "control", label: "Control", color: "#377eb8", count: 389 },
  { value: "high-risk", label: "High risk", color: "#f5761a", count: 64 },
  { value: "unknown", label: "Unknown", color: "#bdbdbd", count: 27 },
];

/** The chips with their toggles and hover wired to local state, as a page wires them to its plot. */
const Interactive = (args: ChipLegendProps) => {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const toggle = (value: string) => {
    const next = new Set(hidden);
    if (!next.delete(value)) next.add(value);
    setHidden(next);
  };

  return (
    <Stack gap={1.5}>
      <ChipLegend {...args} hidden={hidden} onToggle={toggle} highlighted={hovered} onHover={setHovered} />
      <Typography variant="caption" color="text.secondary">
        Hovered: {hovered ?? "none"} · Hidden: {[...hidden].join(", ") || "none"}
      </Typography>
    </Stack>
  );
};

const meta = {
  title: "visualization/Legend/ChipLegend",
  component: ChipLegend,
  tags: ["autodocs"],
  args: { groups: GROUPS, hidden: new Set(), onToggle: () => {} },
  render: (args) => <Interactive {...args} />,
} satisfies Meta<typeof ChipLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click a chip to switch its group off; hover one to ring it. */
export const Default: Story = {};

/** Each chip draws its group's point shape, where the plot is shaped by the same field. */
export const WithShapes: Story = {
  args: {
    groups: GROUPS.map((group, i) => ({ ...group, shape: POINT_SHAPES[(i + 1) % POINT_SHAPES.length] })),
  },
};

/** A group whose label doesn't say everything explains itself on hover. */
export const WithTooltip: Story = {
  args: {
    groups: [
      ...GROUPS.slice(0, 2),
      {
        value: "other",
        label: "Other sites",
        color: "#984ea3",
        count: 18,
        tooltip: "Combined, since each has fewer than 10 samples: Site D, Site E, Site F",
      },
    ],
  },
};

/** Named, for a plot with a second row of chips beside it. */
export const Labeled: Story = {
  args: { label: "Status" },
};

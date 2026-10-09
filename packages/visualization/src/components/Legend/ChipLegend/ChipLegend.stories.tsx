import { Box, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { POINT_SHAPES } from "../../ScatterPlot/types";
import ChipLegend, { type ChipLegendProps, type LegendGroup } from "./ChipLegend";

const GROUPS: LegendGroup[] = [
  { value: "case", label: "Case", color: "#e41a1c", count: 412 },
  { value: "control", label: "Control", color: "#377eb8", count: 389 },
  { value: "high-risk", label: "High risk", color: "#f5761a", count: 64 },
  { value: "unknown", label: "Unknown", color: "#bdbdbd", count: 27 },
];

const TISSUES = [
  "Brain",
  "Liver",
  "Lung",
  "Heart",
  "Kidney",
  "Spleen",
  "Stomach",
  "Colon",
  "Pancreas",
  "Skin",
  "Muscle",
  "Adipose",
  "Blood",
  "Bone marrow",
  "Thyroid",
  "Adrenal gland",
  "Esophagus",
  "Small intestine",
  "Prostate",
  "Testis",
  "Ovary",
  "Uterus",
  "Breast",
  "Placenta",
  "Thymus",
  "Tonsil",
  "Retina",
  "Bladder",
];

/** A field with more groups than fit in a row, largest first. */
const MANY_GROUPS: LegendGroup[] = TISSUES.map((name, i) => ({
  value: name.toLowerCase(),
  label: name,
  color: `hsl(${(i * 137.5) % 360}, 55%, 48%)`,
  count: Math.round(900 / (i + 1)),
}));

/**
 * The chips with their toggles and hover wired to local state, as a page wires them to its plot.
 * With `points`, a dot per group stands in for the plot: hovering one highlights its group, as
 * hovering a point would.
 */
const Interactive = ({ points = false, ...args }: ChipLegendProps & { points?: boolean }) => {
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
      {points && (
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {args.groups.map(({ value, color }) => (
            <Box
              key={value}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(null)}
              sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: color, opacity: hidden.has(value) ? 0.3 : 1 }}
            />
          ))}
        </Stack>
      )}
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

/**
 * One row that scrolls sideways, for a field with dozens of groups. Hover a dot below, standing in
 * for a point on the plot, and its chip scrolls into view.
 */
export const Scrollable: Story = {
  args: { groups: MANY_GROUPS, scrollable: true },
  render: (args) => (
    <Box maxWidth={520}>
      <Interactive {...args} points />
    </Box>
  ),
};

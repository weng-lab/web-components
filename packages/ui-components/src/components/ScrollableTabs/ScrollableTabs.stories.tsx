import { useState } from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Tab } from "@mui/material";
import { ScrollableTabs } from "../..";

const meta = {
  title: "ui-components/ScrollableTabs",
  component: ScrollableTabs,
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollableTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels = ["Primary Classification", "Additional Classification", "DNase", "ATAC", "H3K4me3", "H3K27ac", "CTCF"];

const Tabbed = ({ orientation }: { orientation?: "horizontal" | "vertical" }) => {
  const [value, setValue] = useState(0);
  return (
    <Box sx={orientation === "vertical" ? { height: 240, display: "flex" } : { maxWidth: 480 }}>
      <ScrollableTabs value={value} onChange={(_, v: number) => setValue(v)} orientation={orientation}>
        {labels.map((label, i) => (
          <Tab key={label} value={i} label={label} />
        ))}
      </ScrollableTabs>
    </Box>
  );
};

/** More tabs than fit: the tabs fade out at an end with more past it, deepening as they're scrolled from it. */
export const Default: Story = {
  render: () => <Tabbed />,
};

export const Vertical: Story = {
  render: () => <Tabbed orientation="vertical" />,
};

/** On a phone, which MUI's Tabs leave without scroll buttons unless asked. */
export const Phone: Story = {
  tags: ["mobile", "!autodocs"],
  globals: { viewport: { value: "iphone14", isRotated: false } },
  render: () => <Tabbed />,
};

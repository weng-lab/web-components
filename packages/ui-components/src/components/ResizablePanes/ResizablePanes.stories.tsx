import { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import { ResizablePanes } from "../..";

const meta = {
  title: "ui-components/ResizablePanes",
  component: ResizablePanes,
  tags: ["autodocs"],
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof ResizablePanes>;

export default meta;
type Story = StoryObj<typeof meta>;

const PaneContent = ({ label, color }: { label: string; color: string }) => (
  <Box
    height="100%"
    display="flex"
    alignItems="center"
    justifyContent="center"
    sx={{ bgcolor: color, borderRadius: 1, border: "1px solid", borderColor: "divider" }}
  >
    <Typography variant="h6">{label}</Typography>
  </Box>
);

/** Plain two-pane split with a draggable divider. Drag it, or focus it and use Arrow / Home / End keys. */
export const Default: Story = {
  args: {
    first: <PaneContent label="First pane" color="action.hover" />,
    second: <PaneContent label="Second pane" color="action.selected" />,
    rowHeight: "400px",
  },
};

/** The first pane collapsed — the second pane fills the width and the divider is hidden. */
export const Collapsed: Story = {
  args: {
    first: <PaneContent label="First pane" color="action.hover" />,
    second: <PaneContent label="Second pane" color="action.selected" />,
    collapsed: "first",
    rowHeight: "400px",
  },
};

/** Column mode — panes stack vertically and the divider is hidden. */
export const Column: Story = {
  args: {
    first: <PaneContent label="Top pane" color="action.hover" />,
    second: <PaneContent label="Bottom pane" color="action.selected" />,
    direction: "column",
    columnHeight: "200px",
  },
};

/** Responsive — stacked below `lg`, side-by-side at `lg` and up. Resize the viewport to see it switch. */
export const Responsive: Story = {
  args: {
    first: <PaneContent label="First pane" color="action.hover" />,
    second: <PaneContent label="Second pane" color="action.selected" />,
    direction: { xs: "column", lg: "row" },
    rowHeight: "400px",
    columnHeight: "200px",
  },
};

import { Meta, StoryObj } from "@storybook/react-vite";
import PhyloTree from "./PhyloTree";
import { data } from "./data";

const meta = {
  title: "visualization/PhyloTree",
  component: PhyloTree,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 850, height: 500 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PhyloTree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBranchLengths: Story = {
  args: {
    data: data,
    width: 800,
    height: 800,
    useBranchLengths: true,
  },
};

export const WithoutBranchLengths: Story = {
  args: {
    data: data,
    width: 800,
    height: 800,
  },
};
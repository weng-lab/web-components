import React, { useState } from "react";
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

export const InteractiveBranchLength: Story = {
  render: (args) => {
    const [useBranchLengths, setUseBranchLengths] = useState<boolean>(args.useBranchLengths ?? false);

    return (
      <div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={useBranchLengths}
            onChange={(e) => setUseBranchLengths(e.target.checked)}
          />
          Use Branch Lengths
        </label>
        <div style={{ width: 850, height: 500 }}>
          <PhyloTree {...args} useBranchLengths={useBranchLengths} />
        </div>
      </div>
    );
  },
  args: {
    data: data,
    width: 800,
    height: 800,
    useBranchLengths: false,
  },
};
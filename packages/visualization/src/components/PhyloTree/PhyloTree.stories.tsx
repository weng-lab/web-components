import React, { useState } from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import PhyloTree from "./PhyloTree";
import { data } from "./data";
import {ParentSize} from "@visx/responsive"

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
      <Story />
    ),
  ],
} satisfies Meta<typeof PhyloTree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [useBranchLengths, setUseBranchLengths] = useState<boolean>(args.useBranchLengths ?? true);

    return (
      <div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input type="checkbox" checked={useBranchLengths} onChange={(e) => setUseBranchLengths(e.target.checked)} />
          Use Branch Lengths
        </label>
        <PhyloTree {...args} useBranchLengths={useBranchLengths} />
      </div>
    );
  },
  args: {
    data: data,
    width: 1000,
    height: 1000,
    useBranchLengths: true,
  },
};
import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { XAxis } from "../../index";

const meta = {
  title: "seq-logo/XAxis",
  component: XAxis,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof XAxis>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    n: 20,
    glyphWidth: 20,
  },
  render: (args) => (
    <svg width={1000}>
      <XAxis {...args} />
    </svg>
  ),
};

export const StartPos: Story = {
  args: {
    n: 15,
    glyphWidth: 20,
    startPos: 3,
  },
  render: (args) => (
    <svg width={1000}>
      <XAxis {...args} />
    </svg>
  ),
};

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  YAxis,
  YAxisFrequency,
  YGridlines,
  YAxisWithNegatives,
} from "../../index";

const meta = {
  title: "logo/YAxis",
  component: YAxis,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof YAxis>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    transform: "translate(0,10)",
    width: 70,
    height: 100,
    bits: 5,
  },
  render: (args) => (
    <svg width={150}>
      <YAxis {...args} />
    </svg>
  ),
};

export const ZeroPoint: Story = {
  args: {
    transform: "translate(0,10)",
    width: 70,
    height: 150,
    bits: 5,
    zeroPoint: 2,
  },
  render: (args) => (
    <svg width={200} height={1000}>
      <YAxis {...args} />
    </svg>
  ),
};

const frequencyMeta = {
  title: "logo/YAxisFrequency",
  component: YAxisFrequency,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof YAxisFrequency>;

export const ByFrequency: StoryObj<typeof frequencyMeta> = {
  args: {
    transform: "translate(0,10)",
    width: 70,
    height: 150,
    ticks: 10,
  },
  render: (args) => (
    <svg width={200} height={1000}>
      <YAxisFrequency {...args} />
    </svg>
  ),
};

const withNegativesMeta = {
  title: "logo/YAxisWithNegatives",
  component: YAxisWithNegatives,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof YAxisWithNegatives>;

export const WithPositiveMinAndMax: StoryObj<typeof withNegativesMeta> = {
  args: {
    transform: "translate(0,10)",
    width: 70,
    height: 150,
    max: 10,
    min: 3,
  },
  render: (args) => (
    <svg width={200} height={1000}>
      <YAxisWithNegatives {...args} />
    </svg>
  ),
};

export const WithNegativeMinAndMax: StoryObj<typeof withNegativesMeta> = {
  args: {
    transform: "translate(0,10)",
    width: 70,
    height: 150,
    max: 3,
    min: -5,
  },
  render: (args) => (
    <svg width={200} height={1000}>
      <YAxisWithNegatives {...args} />
    </svg>
  ),
};

const gridlinesMeta = {
  title: "logo/YGridlines",
  component: YGridlines,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof YGridlines>;

export const GridLines: StoryObj<typeof gridlinesMeta> = {
  args: {
    xstart: 100,
    width: 400,
    height: 400,
    minrange: 100,
    maxrange: 200,
    xaxis_y: 20,
    numberofgridlines: 8,
  },
  render: (args) => (
    <svg width={450} height={1000}>
      <YGridlines {...args} />
    </svg>
  ),
};

import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { A, B, Glyph, GlyphStack, Alphabets } from "../../index";

const ALPHABET: Alphabets[] = [
  { component: [A, B], regex: ["A", "B"], color: ["#ff0000", "#ff0000"] },
  { component: [B], regex: ["B"], color: ["#bb8800"] },
  { component: [A], regex: ["A"], color: ["#ff0000"] },
];

const meta = {
  title: "seq-logo/Glyph",
  component: Glyph,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    yscale: 0.8,
    xscale: 0.4,
  },
} satisfies Meta<typeof Glyph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    yscale: 0.8,
    xscale: 0.4,
  },
  render: (args) => (
    <svg width={1000}>
      <Glyph {...args}>
        <A />
      </Glyph>
    </svg>
  ),
};

export const ColoredGlyph: Story = {
  args: {
    yscale: 0.8,
    xscale: 0.4,
  },
  render: (args) => (
    <svg width={1000}>
      <Glyph {...args}>
        <A fill={"#0000ff"} />
      </Glyph>
    </svg>
  ),
};

export const GlyphWithScale: Story = {
  args: {
    yscale: 0.8,
    xscale: 0.3,
    inverted: false,
  },
  render: (args) => (
    <svg width={100}>
      <Glyph {...args}>
        <A />
      </Glyph>
    </svg>
  ),
};

export const InvertedGlyph: Story = {
  args: {
    yscale: 0.8,
    xscale: 0.3,
    inverted: true,
  },
  render: (args) => (
    <svg width={300}>
      <g transform="translate(0,100)">
        <Glyph {...args}>
          <A />
        </Glyph>
      </g>
    </svg>
  ),
};

export const GlyphWithOpacity: Story = {
  args: {
    yscale: 0.8,
    xscale: 0.3,
  },
  render: (args) => (
    <svg width={300}>
      <Glyph {...args}>
        <A fillOpacity={0.2} />
      </Glyph>
    </svg>
  ),
};

const glyphStackMeta = {
  title: "seq-logo/GlyphStack",
  component: GlyphStack,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    indices: [0, 1, 2],
    alphabet: ALPHABET,
    lv: [0.2, 0.8, 0.5],
    width: 100,
    height: 200,
  },
} satisfies Meta<typeof GlyphStack>;

export const Glyphstack: StoryObj<typeof glyphStackMeta> = {
  args: {
    indices: [0, 1, 2],
    alphabet: ALPHABET,
    lv: [0.2, 0.8, 0.5],
    width: 100,
    height: 200,
  },
  render: (args) => (
    <svg width={200} height={300}>
      <GlyphStack
        {...args}
        onSymbolClick={(s: any) => {
          console.log(s);
        }}
        onSymbolMouseOver={(s: Alphabets) => {
          console.log(s);
        }}
      />
    </svg>
  ),
};

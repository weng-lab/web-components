import { useState } from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import PhyloTree from "./PhyloTree";
import { data } from "./example-data/241_mammals_treedata";
import { getColor, getLabel, getOrder } from "./example-data/utils";
import { TreeItem } from "./types";

const meta = {
  title: "visualization/PhyloTree",
  component: PhyloTree,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
  decorators: [(Story) => <Story />],
} satisfies Meta<typeof PhyloTree>;

export default meta;
type Story = StoryObj<typeof meta>;

type TestDataNode = { name: string; branch_length: number | null; children?: TestDataNode[] };

const formatNode = (node: TestDataNode): TreeItem => {
  const newNode: TreeItem = { id: node.name, branch_length: node.branch_length };

  if (node.children) {
    const newChildren = node.children.map((child) => formatNode(child));
    newNode.children = newChildren
  }

  return newNode;
};



export const Mammals241: Story = {
  args: {
    data: formatNode(data),
    width: 600,
    height: 600,
    getColor,
    getLabel,
    tooltipContents: (item) => (
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>{getLabel(item)}</div>
        <div style={{ opacity: 0.8 }}>{getOrder(item)}</div>
      </div>
    ),
  },
};

export const HighlightLeaves: Story = {
  args: {
    data: formatNode(data),
    highlighted: ["Homo_sapiens", "Pan_paniscus", "Pan_troglodytes", "Gorilla_gorilla", "Sorex_araneus"],
    width: 600,
    height: 600,
    getColor,
    getLabel,
    tooltipContents: (item) => (
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>{getLabel(item)}</div>
        <div style={{ opacity: 0.8 }}>{getOrder(item)}</div>
      </div>
    ),
  },
};

export const OnLeafHoverChange: Story = {
  args: {
    data: formatNode(data),
    highlighted: ["Homo_sapiens", "Pan_paniscus", "Pan_troglodytes", "Gorilla_gorilla", "Sorex_araneus"],
    width: 600,
    height: 600,
    getColor,
    getLabel,
    onLeafClick: (id) => window.alert("Clicked: " + id),
    tooltipContents: (item) => (
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>{getLabel(item)}</div>
        <div style={{ opacity: 0.8 }}>{getOrder(item)}</div>
      </div>
    ),
  },
  render: (args) => {
    const [hovered, setHovered] = useState<string[]>([])

    return (
      <>
        <PhyloTree {...args} onLeafHoverChange={setHovered} />
        <p>hovered: {hovered.join(", ")}</p>
      </>
    );
  }
};
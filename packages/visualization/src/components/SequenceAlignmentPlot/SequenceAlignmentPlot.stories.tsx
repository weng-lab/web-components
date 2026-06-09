import { Meta, StoryObj } from "@storybook/react-vite";
import { SequenceAlignmentPlot, TooltipData } from "./index";
import { EH38E3465364, EH38E4276533, EH38E4276534 } from "./example-data/mockData";
import { getColor, getColorLabel, getLabel, getOrder, getPrimateGroup, makeAlignmentPlotData, SPECIES_ORDER_IN_API_RETURN } from "../PhyloTree/example-data/utils";
import { useState } from "react";


const meta = {
  title: "visualization/SequenceAlignmentPlot",
  component: SequenceAlignmentPlot,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
  decorators: [(Story) => <Story />],
} satisfies Meta<typeof SequenceAlignmentPlot>;

export default meta;
type Story = StoryObj<typeof meta>;


const PlotTooltip = (props: TooltipData) => (
  <div
    style={{
      fontSize: 12,
    }}
  >
    <div style={{ fontWeight: 600 }}>{getLabel(props.id)}</div>
    <div>{props.id.replaceAll("_", " ")}</div>
    <div>{getOrder(props.id).toLowerCase()}</div>
    {getPrimateGroup(props.id) && <div>{getColorLabel(props.id)}</div>}
    {props.charLabel && <div>{props.charLabel}</div>}
    {props.position && <div>{props.position}</div>}
  </div>
);

const dataEH38E4276533 = makeAlignmentPlotData(EH38E4276533.ccreSequenceAlignmentQuery[0].sequence_alignment, SPECIES_ORDER_IN_API_RETURN)
const dataEH38E4276534 = makeAlignmentPlotData(EH38E4276534.ccreSequenceAlignmentQuery[0].sequence_alignment, SPECIES_ORDER_IN_API_RETURN)
const dataEH38E3465364 = makeAlignmentPlotData(EH38E3465364.ccreSequenceAlignmentQuery[0].sequence_alignment, SPECIES_ORDER_IN_API_RETURN)

export const EH38E4276533_: Story = {
  args: {
    data: dataEH38E4276533,
    width: 1000,
    height: 500,
    getLabel: getLabel,
    getOrder: (id) => getOrder(id) ?? "",
    getOrderColor: getColor,
    hovered: ["Homo_sapiens"],
    tooltipContents: (tooltipData) => <PlotTooltip {...tooltipData} />
  },
};

export const EH38E3465364_: Story = {
  args: {
    data: dataEH38E3465364,
    width: 1000,
    height: 500,
    getLabel: getLabel,
    getOrder: (id) => getOrder(id) ?? "",
    getOrderColor: getColor,
    tooltipContents: (tooltipData) => <PlotTooltip {...tooltipData} />
  },
};

export const hoverChange: Story = {
  args: {
    data: dataEH38E4276534,
    width: 1000,
    height: 500,
    getLabel: getLabel,
    getOrder: (id) => getOrder(id) ?? "",
    getOrderColor: getColor,
    tooltipContents: (tooltipData) => <PlotTooltip {...tooltipData} />
  },
  render: (args) => {
    const [hovered, setHovered] = useState<string | null>(null);
    return (
      <>
        <SequenceAlignmentPlot {...args} onHoverChange={setHovered} />
        <p>hovered: {hovered}</p>
      </>
    );
  }
};

export const highlighted: Story = {
  args: {
    data: dataEH38E4276534,
    width: 1000,
    height: 500,
    highlighted: ["Homo_sapiens"],
    getLabel: getLabel,
    getOrder: (id) => getOrder(id) ?? "",
    getOrderColor: getColor,
    tooltipContents: (tooltipData) => <PlotTooltip {...tooltipData} />
  },
};
import { useState } from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import { SequenceAlignmentPlot, Nucleotide, TooltipData } from "./index";
import { EH38E3465364, EH38E4276533, EH38E4276534 } from "./example-data/mockData";
import { getColor, getLabel, getOrder, sortByOrder, speciesOrderInApiData } from "../PhyloTree/example-data/utils";

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

const numberToNucleotide = new Map<number, Nucleotide>([
  [0, "-"],
  [1, "A"],
  [2, "C"],
  [3, "G"],
  [4, "T"],
]);

const makePlotData = (sequences: number[][], speciesOrder: string[]): {[species: string]: Nucleotide[]} => {
    const data: {[species: string]: Nucleotide[]} = {}
    sequences.forEach((sequence, i) => {
      const species = speciesOrder[i]
      data[species] = sequence.map(num => numberToNucleotide.get(num) ?? "-")
    })

    return data
}

const sortPlotDataByOrder = (data: {[species: string]: Nucleotide[]}) => {
  return Object.fromEntries(Object.entries(data).sort(([speciesA, seqA], [speciesB, seqB]) =>  sortByOrder(speciesA, speciesB)))
}

export default meta;
type Story = StoryObj<typeof meta>;

const dataEH38E4276533 = sortPlotDataByOrder(makePlotData(EH38E4276533.data.ccreSequenceAlignmentQuery[0].sequence_alignment, speciesOrderInApiData))
const dataEH38E4276534 = sortPlotDataByOrder(makePlotData(EH38E4276534.data.ccreSequenceAlignmentQuery[0].sequence_alignment, speciesOrderInApiData))
const dataEH38E3465364 = sortPlotDataByOrder(makePlotData(EH38E3465364.data.ccreSequenceAlignmentQuery[0].sequence_alignment, speciesOrderInApiData))

const tooltipContents = (tooltipData: TooltipData) => (
  <div
    style={{
      fontSize: 12,
    }}
  >
    {tooltipData.label} • {tooltipData.order}
    {tooltipData.basePair && tooltipData.position ? ` • pos ${tooltipData.position} • ${tooltipData.basePair}` : ""}
  </div>
);

export const EH38E4276533_: Story = {
  args: {
    data: dataEH38E4276533,
    width: 1000,
    height: 500,
    getLabel: getLabel,
    getOrder: (id) => getOrder(id) ?? "",
    getOrderColor: getColor,
    highlighted: ["Homo_sapiens"],
    tooltipContents
  },
};

export const EH38E4276534_: Story = {
  args: {
    data: dataEH38E4276534,
    width: 1000,
    height: 500,
    getLabel: getLabel,
    getOrder: (id) => getOrder(id) ?? "",
    getOrderColor: getColor,
    tooltipContents
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
    tooltipContents
  },
};
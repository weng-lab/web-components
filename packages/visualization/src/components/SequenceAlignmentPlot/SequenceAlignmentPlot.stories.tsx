import { useState } from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import { SequenceAlignmentPlot, Nucleotide } from "./index";
import dataRawEH38E4276533 from "./EH38E4276533.txt?raw";
import dataRawEH38E4276534 from "./EH38E4276534.txt?raw";
import dataRawEH38E3465364 from "./EH38E3465364.txt?raw";


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

const sequenceMap = new Map<string, Nucleotide>([
  ['0', "-"],
  ['1', "A"],
  ['2', "C"],
  ['3', "G"],
  ['4', "T"],
]);

const generateSequenes = (rawData: string[]) => {
  return rawData.map((numSequence) =>
    numSequence
      .split("")
      .map((char) => sequenceMap.get(char) ?? "-")
  );
};

export default meta;
type Story = StoryObj<typeof meta>;

const dataEH38E4276533 = generateSequenes(dataRawEH38E4276533.replaceAll(' ', '').split('\n'))
const dataEH38E4276534 = generateSequenes(dataRawEH38E4276534.replaceAll(' ', '').split('\n'))
const dataEH38E3465364 = generateSequenes(dataRawEH38E3465364.replaceAll(' ', '').split('\n'))


export const EH38E4276533: Story = {
  args: {
    data: dataEH38E4276533,
    width: dataEH38E4276533[0].length * 2,
    height: dataEH38E4276533.length * 2,
  },
};

export const EH38E4276534: Story = {
  args: {
    data: dataEH38E4276534,
    width: dataEH38E4276534[0].length * 2,
    height: dataEH38E4276534.length * 2,
  },
};

export const EH38E3465364: Story = {
  args: {
    data: dataEH38E3465364,
    width: dataEH38E3465364[0].length,
    height: dataEH38E3465364.length,
  },
};

export const EH38E3465364x2: Story = {
  args: {
    data: dataEH38E3465364,
    width: dataEH38E3465364[0].length * 2,
    height: dataEH38E3465364.length * 2,
  },
};
import { Meta, StoryObj } from '@storybook/react-vite';
import { Graph } from '.';
import data2 from './example-data/data2.json';
import data3 from './example-data/data3.json';
import data from './example-data/data.json';
import { Edge, Node } from './types';

function setColor(node: Node | Edge): string {
  if (node.category !== undefined) {
    switch (node.category) {
      case 'PLS':
        return '#FF0000';
      case 'dELS':
        return '#FFCD00';
      case 'pELS':
        return '#FFA700';
      case 'CA-CTCF':
        return '#00B0F0';
      case 'CA-H3K4me3':
        return '#ffaaaa';
      case 'CA-TF':
        return '#be28e5';
      case 'Low-DNase':
        return '#e1e1e1';
      case 'lower-expression':
        return 'rgb(0,0,0)';
      case 'higher-expression':
        return 'rgb(0,0,225)';
      default:
        return 'grey';
    }
  }
  return 'grey';
}

function setColor2(node: Node | Edge): string {
  if (node.category !== undefined) {
    switch (node.category) {
      case 'PLS':
        return 'red';
      case 'dELS':
        return 'orange';
      case 'pELS':
        return 'yellow';
      case 'CA-CTCF':
        return 'green';
      case 'CA-H3K4me3':
        return 'blue';
      case 'CA-TF':
        return 'purple';
      case 'Low-DNase':
        return 'pink';
      case 'lower-expression':
        return 'black';
      case 'higher-expression':
        return 'purple';
      default:
        return 'grey';
    }
  }
  return 'grey';
}

function setColor3(node: Node | Edge): string {
  if (node && node.category !== undefined) {
    switch (node.category) {
      case 'R':
        return 'red';
      case 'P':
        return 'purple';
      case 'B':
        return 'blue';
      case 'hello':
        return 'pink';
      case 'hi':
        return 'green';
      default:
        return 'grey';
    }
  } else {
    return 'grey';
  }
}

function convertToSimple(node: Node | Edge): string {
  if (node.category) {
    switch (node.category) {
      case 'PLS':
        return 'Promoter';
      case 'dELS':
        return 'Distal Enhancer';
      case 'pELS':
        return 'Proximal Enhancer';
      case 'CA-CTCF':
        return 'Chromatin Accessible + CTCF';
      case 'CA-H3K4me3':
        return 'Chromatin Accessible + H3K4me3';
      case 'CA-TF':
        return 'Chromatin Accessible + Transcription Factor';
      case 'Low-DNase':
        return 'Low DNase';
      case 'CA-only':
        return 'Chromatin Accessible';
      case 'lower-expression':
        return 'Lower-Expression';
      case 'higher-expression':
        return 'Higher-Expression';
      default:
        return node.category;
    }
  }
  return 'Edge';
}

function convertToSimple2(node: Node | Edge): string {
  if (node.category !== undefined) {
    switch (node.category) {
      case 'R':
        return 'red nodes';
      case 'B':
        return 'blue nodes';
      case 'P':
        return 'purple nodes';
      default:
        return node.category;
    }
  }
  return 'Edge';
}
const meta = {
  title: 'visualization/Graph',
  tags: ['autodocs'],
  component: Graph,
} satisfies Meta<typeof Graph>;

export default meta;
type Story = StoryObj<typeof meta>

export const SampleGraph: Story = {
  args: {
    data: data2.data,
    title: 'Sample Graph (non-cCRE)',
    id: 'Sample',
    scale: (n: number) => 10 * n,
    getColor: setColor3,
    legendToggle: convertToSimple2,
    order: ['P', 'R', 'B'],
    onNodeClick: (n: {
      accession: string;
      start: number;
      end: number;
      chromosome: string;
    }) => console.log('Accession: ' + n.accession),
  }
}

export const PilotDataWithCentered: Story = {
  args: {
    data: data.data,
    title: 'cCRE Impact With Pilot Data With Centered cCRE',
    id: 'PilotWithCentered',
    getColor: setColor,
    legendToggle: convertToSimple,
    legendNodeLabel: 'cCRE Type',
    order: [
      'PLS',
      'pELS',
      'dELS',
      'CA-H3K4me3',
      'CA-CTCF',
      'CA-TF',
      'CA',
      'TF',
      'Low DNase',
    ],
    fontFamily: 'Times New Roman',
    directional: true,
  }
}

export const FiftyPercent: Story = {
  args: {
    data: data.data,
    title: '50% Width and Height',
    id: '50Percent',
    width: '50%',
    height: '50%',
    getColor: setColor,
    legendToggle: convertToSimple,
    legendNodeLabel: 'cCRE Type',
    directional: true,
  }
}

export const PilotDataWithoutCentered: Story = {
  args: {
    data: data3.data,
    title: 'cCRE Impact With Pilot Data Without Centered cCRE',
    id: 'PilotNoCentered',
    getColor: setColor,
    legendToggle: convertToSimple,
    legendNodeLabel: 'cCRE Type',
    directional: true,
  }
}

export const DifferentLabel: Story = {
  args: {
    data: data3.data,
    title: 'Different Label',
    id: 'diffLabel',
    getLabel: (node: Node) => node.category,
    getColor: setColor,
    legendToggle: convertToSimple,
    legendNodeLabel: 'Different Node Label',
    legendEdgeLabel: 'Different Edge Label',
    directional: true,
  }
}

export const DifferentColor: Story = {
  args: {
    data: data3.data,
    title: 'Different Color',
    id: 'diffColor',
    getColor: setColor2,
    legendToggle: convertToSimple,
  }
}

export const NoLegendToggle: Story = {
  args: {
    data: data2.data,
    title: 'No Legend Toggle',
    id: 'noLegendToggle',
    scale: (n: number) => 10 * n,
    getColor: setColor3,
  }
}

export const DifferentOrder: Story = {
  args: {
    data: data.data,
    title: 'Different Order',
    id: 'diffOrder',
    getColor: setColor,
    legendToggle: convertToSimple,
    legendNodeLabel: 'cCRE Type',
    order: [
      'Low DNase',
      'PLS',
      'dELS',
      'TF',
      'pELS',
      'CA-CTCF',
      'CA',
      'CA-H3K4me3',
      'CA-TF',
    ],
    directional: true,
  }
}

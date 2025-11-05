import { Meta, StoryObj } from '@storybook/react-vite';
import Treemap from './TreeMap';
import { TreemapNode } from './types';
import { Box } from '@mui/material';

const meta = {
    title: 'visualization/TreeMap',
    component: Treemap,
    tags: ['autodocs'],
    argTypes: {
    },
    parameters: {
        controls: { expanded: true },
    },
    decorators: [
        (Story) => (
          <div style={{ width: 850, height: 500}}>
            <Story />
          </div>
        ),
      ],
} satisfies Meta<typeof Treemap>;

export default meta;
type Story = StoryObj<typeof meta>;

type MyMetadata = {
    description: string;
    source: string;
};

const data: TreemapNode<MyMetadata>[] = [
    { label: "Other Measurment", value: 2764, style: {color: "#046798"} },
    { label: "Hematological measurement", value: 11555, style: {color: "#398e80"} },
    { label: "lipid or lipoprotein measurement", value: 4772, style: {color: "#699123"} },
    { label: "Body weights and measures", value: 3984, style: {color: "#0288c9"} },
    { label: "Other diseases", value: 3004, style: {color: "#7f79b4"} },
    { label: "Other traits", value: 2822, style: {color: "#f75745"} },
    { label: "Other traits", value: 2822, style: {color: "#f75745"} },
    { label: "Cancer", value: 2713, style: {color: "#a760aa"} },
    { label: "Biological process", value: 2523, style: {color: "#7f79b4"} },
    { label: "Cardiovascular disease", value: 1607, style: {color: "#b13434"} },
    { label: "Imuune system disease", value: 2380, style: {color: "#a79100"} },
    { label: "Biological process", value: 2523, style: {color: "#7f79b4"} },
    { label: "Biological process", value: 2523, style: {color: "#7f79b4"} },
    { label: "Biological process", value: 2523, style: {color: "#7f79b4"} },
    { label: "Lorem ipsum", value: 2523, style: {color: "#7f79b4"} },
    { label: "Respitory", value: 446, style: {color: "#7f79b4"} },
];

// Default story
export const Default: Story = {
    args: {
        data: data,
    },
};

export const Style: Story = {
    args: {
        data: data,
        labelPlacement: 'topLeft',
        treemapStyle: { padding: 8, borderRadius: 5, paddingOuter: 1 }
    },
};

export const TileMethod: Story = {
    args: {
        data: data,
        labelPlacement: 'topLeft',
        treemapStyle: { padding: 8, borderRadius: 5, paddingOuter: 1 },
        tileMethod: "treemapSlice"
    },
};

export const Tooltip: Story = {
    args: {
        data: data,
        labelPlacement: 'topLeft',
        treemapStyle: { padding: 8, borderRadius: 5, paddingOuter: 1 },
        tooltipBody: (node) => (
            <Box maxWidth={300}>
                <div><strong>Label:</strong> {node.label}</div>
                <div><strong>Value:</strong> {node.value}</div>
            </Box>
        ),
    },
};

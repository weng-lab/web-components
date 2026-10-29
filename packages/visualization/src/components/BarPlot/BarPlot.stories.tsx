import { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Barplot from './barplot';
import { BarData } from './types';

const meta = {
    title: 'visualization/Barplot',
    component: Barplot,
    tags: ['autodocs'],
    argTypes: {
    },
    parameters: {
        controls: { expanded: true },
    },
    decorators: [
        // Mobile stories size to the device instead - see .storybook/preview.tsx
        (Story, { tags }) => tags.includes('mobile') ? <Story /> : (
            <div style={{ width: 850, height: 500 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Barplot>;

export default meta;
type Story = StoryObj<typeof meta>;

type MyMetadata = {
    description: string;
    source: string;
};

const sampleData: BarData<MyMetadata>[] = [
    {
        category: "Group A",
        label: "Apples",
        value: 30,
        id: "apples-a1",
        color: "#FF6384",
        metadata: { description: "Red apples from Group A", source: "Orchard 1" }
    },
    {
        category: "Group B",
        label: "Grapes",
        value: 50,
        id: "grapes-b1",
        color: "#4BC0C0",
        metadata: { description: "Seedless grapes from Group B", source: "Vineyard 1" }
    },
    {
        category: "Group C",
        label: "Bananas",
        value: 27,
        id: "bananas-c1",
        color: "#FFCD56",
        metadata: { description: "Sweet bananas from Group C", source: "Plantation 4" }
    },
]

const lollipopData: BarData<MyMetadata>[] = [
    {
        category: "Group A",
        label: "Apples",
        value: 30,
        id: "apples-a1",
        color: "#FF6384",
        lollipopValue: .05,
        metadata: { description: "Red apples from Group A", source: "Orchard 1" }
    },
    {
        category: "Group B",
        label: "Grapes",
        value: 50,
        id: "grapes-b1",
        color: "#4BC0C0",
        lollipopValue: .01,
        metadata: { description: "Seedless grapes from Group B", source: "Vineyard 1" }
    },
    {
        category: "Group C",
        label: "Bananas",
        value: 27,
        id: "bananas-c1",
        color: "#FFCD56",
        lollipopValue: .001,
        metadata: { description: "Sweet bananas from Group C", source: "Plantation 4" }
    },
]

const TooltipContents = (bar: BarData<MyMetadata>) => (
    <div style={{ padding: 2 }}>
        <strong>{bar.label}</strong>
        <div>Value: {bar.value}</div>
        {bar.metadata && (
            <>
                <div>Description: {bar.metadata.description}</div>
                <div>Source: {bar.metadata.source}</div>
            </>
        )}
    </div>
);

// Default story
export const Default: Story = {
    args: {
        data: sampleData,
        animation: "scale"
    },
};

export const Fill: Story = {
    args: {
        data: sampleData,
        fill: true
    },
};

export const Customizing: Story = {
    args: {
        data: sampleData,
        barSize: 30,
        barSpacing: 30
    },
};

export const Tooltip: Story = {
    args: {
        data: sampleData,
        TooltipContents: TooltipContents as (bar: BarData<unknown>) => React.ReactNode
    },
};

export const lollipop: Story = {
    args: {
        data: lollipopData,
        barSize: 5,
        barSpacing: 30
    },
};

// Manually sized plot. Container is 900x600 with a dashed border - the plot
// should render at the fixed 400x300 size below, ignoring the container size.
export const ManualSize: Story = {
    args: {
        data: sampleData,
        width: 400,
        height: 300,
    },
    decorators: [
        (Story) => (
            <div style={{ width: 900, height: 600, border: '2px dashed #999' }}>
                <Story />
            </div>
        ),
    ],
};

export const Mobile: Story = {
    tags: ['mobile', '!autodocs'],
    globals: { viewport: { value: 'iphone14', isRotated: false } },
    args: {
        data: sampleData,
        TooltipContents: TooltipContents as (bar: BarData<unknown>) => React.ReactNode,
        onBarClicked: fn(),
    },
    decorators: [(Story) => <div style={{ height: 300 }}><Story /></div>],
};

const SAMPLE_TISSUES = ["Adrenal gland", "Liver", "Muscle", "Embryo", "Skin", "Large intestine", "Kidney", "Ovary", "Spleen", "Pancreas"];
const SAMPLE_COLORS = ["#FF6384", "#4BC0C0", "#FFCD56", "#36A2EB", "#9966FF", "#FF9F40"];

// A gene's expression across samples: more bars than fit the plot's height, under labels longer than fit past them.
const longData: BarData<MyMetadata>[] = Array.from({ length: 60 }, (_, i) => {
    const tissue = SAMPLE_TISSUES[i % SAMPLE_TISSUES.length];
    const value = Math.round(360000 * Math.exp(-i / 12)) / 100;
    return {
        category: tissue,
        label: `${value}, ${tissue}, female adult (${30 + (i % 40)} years) (ENCSR${(100000 + i * 7919) % 1000000}A)`,
        value,
        id: `sample-${i}`,
        color: SAMPLE_COLORS[i % SAMPLE_COLORS.length],
        metadata: { description: `Sample ${i + 1}`, source: tissue },
    };
});

export const MobileLong: Story = {
    tags: ['mobile', '!autodocs'],
    globals: { viewport: { value: 'iphone14', isRotated: false } },
    args: {
        data: longData,
        topAxisLabel: "Expression: TPM",
        TooltipContents: TooltipContents as (bar: BarData<unknown>) => React.ReactNode,
        onBarClicked: fn(),
    },
    decorators: [(Story) => <div style={{ height: 360 }}><Story /></div>],
};

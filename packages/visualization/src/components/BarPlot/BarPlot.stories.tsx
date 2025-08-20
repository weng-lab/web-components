import { Meta, StoryObj } from '@storybook/react-vite';
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
        (Story) => (
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
        data: sampleData
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

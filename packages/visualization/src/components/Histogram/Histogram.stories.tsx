import { Meta, StoryObj } from '@storybook/react-vite';
import Histogram from './Histogram';

const meta = {
    title: 'visualization/Histogram',
    component: Histogram,
    tags: ['autodocs'],
    parameters: {
        controls: { expanded: true },
    },
    decorators: [
        (Story) => (
            <div style={{ width: 800, height: 500 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Histogram>;

export default meta;
type Story = StoryObj<typeof meta>;

// Box-Muller normal distribution
function normalSample(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const normalData = Array.from({ length: 500 }, () => normalSample(0, 1));
const skewedData = Array.from({ length: 500 }, () => Math.abs(normalSample(0, 1)) + Math.random() * 2);

export const Default: Story = {
    args: {
        data: normalData,
        xLabel: 'Value',
        yLabel: 'Count',
        title: 'Normal Distribution',
    },
};

export const CustomColor: Story = {
    args: {
        data: normalData,
        color: '#e45c5c',
        xLabel: 'Measurement',
        yLabel: 'Frequency',
        title: 'Custom Color',
        numBins: 30,
    },
};

export const WithAnimation: Story = {
    args: {
        data: skewedData,
        xLabel: 'Value',
        yLabel: 'Count',
        title: 'Skewed Distribution',
        animationType: 'slideUp',
        color: '#2ca02c',
    },
};

export const CustomTooltip: Story = {
    args: {
        data: normalData,
        xLabel: 'Value',
        yLabel: 'Count',
        title: 'Custom Tooltip',
        tooltipBody: (bin) => (
            <div style={{ fontFamily: 'Roboto,Helvetica,Arial,sans-serif', fontSize: 12, padding: 4 }}>
                <div><strong>Range:</strong> [{bin.x0.toFixed(2)}, {bin.x1.toFixed(2)})</div>
                <div><strong>Count:</strong> {bin.count}</div>
                <div><strong>% of total:</strong> {((bin.count / normalData.length) * 100).toFixed(1)}%</div>
            </div>
        ),
    },
};

export const WithDistributionLine: Story = {
    args: {
        data: normalData,
        xLabel: 'Value',
        yLabel: 'Count',
        title: 'With Distribution Line',
        distributionLine: true,
        distributionLineColor: '#e45c5c',
    },
};

export const MultiSeries: Story = {
    args: {
        data: [
            { values: Array.from({ length: 300 }, () => normalSample(-1, 1)), label: 'Group A', color: '#4c78a8' },
            { values: Array.from({ length: 300 }, () => normalSample(1, 1)),  label: 'Group B', color: '#e45c5c' },
            { values: Array.from({ length: 300 }, () => normalSample(0, 2)),  label: 'Group C', color: '#2ca02c' },
        ],
        xLabel: 'Value',
        yLabel: 'Count',
        title: 'Multi-Series',
        numBins: 25,
    },
};

export const MultiSeriesWithLine: Story = {
    args: {
        data: [
            { values: Array.from({ length: 300 }, () => normalSample(-1, 1)), label: 'Group A', color: '#4c78a8' },
            { values: Array.from({ length: 300 }, () => normalSample(1, 1)),  label: 'Group B', color: '#e45c5c' },
        ],
        xLabel: 'Value',
        yLabel: 'Count',
        title: 'Multi-Series with Distribution Lines',
        distributionLine: true,
        numBins: 25,
    },
};

export const FewBins: Story = {
    args: {
        data: normalData,
        numBins: 10,
        xLabel: 'Value',
        yLabel: 'Count',
        title: '10 Bins',
        color: '#9467bd',
    },
};

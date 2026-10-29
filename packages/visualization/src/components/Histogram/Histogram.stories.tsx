import { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import Histogram from './Histogram';
import { binHistogram } from './binning';

const meta = {
    title: 'visualization/Histogram',
    component: Histogram,
    tags: ['autodocs'],
    parameters: {
        controls: { expanded: true },
    },
    decorators: [
        // Mobile stories size to the device instead - see .storybook/preview.tsx
        (Story, { tags }) => tags.includes('mobile') ? <Story /> : (
            <div style={{ width: 800, height: 500 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Histogram>;

export default meta;
type Story = StoryObj<typeof meta>;

// Seeded, so the same bars draw every time.
let seed = 1;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Box-Muller normal distribution
function normalSample(mean: number, std: number): number {
    const u1 = random();
    const u2 = random();
    return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const normalData = Array.from({ length: 500 }, () => normalSample(0, 1));
const skewedData = Array.from({ length: 500 }, () => Math.abs(normalSample(0, 1)) + random() * 2);

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
        thresholds: 30,
    },
};

export const WithAnimation: Story = {
    args: {
        data: skewedData,
        xLabel: 'Value',
        yLabel: 'Count',
        title: 'Skewed Distribution',
        animationType: 'slideUp',
        densityLine: true,
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
                <div><strong>Range:</strong> {bin.x0.toFixed(2)}, {bin.x1.toFixed(2)}</div>
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
        densityLine: true,
        densityLineColor: '#e45c5c',
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
        thresholds: 25,
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
        densityLine: true,
        thresholds: 25,
    },
};

export const FewBins: Story = {
    args: {
        data: normalData,
        thresholds: 10,
        xLabel: 'Value',
        yLabel: 'Count',
        title: '10 Bins',
        color: '#9467bd',
    },
};

// Manually sized plot. Container is 1000x700 with a dashed border - the plot
// should render at the fixed 400x300 size below, ignoring the container size.
export const ManualSize: Story = {
    args: {
        data: normalData,
        xLabel: 'Value',
        yLabel: 'Count',
        title: 'Manually Sized',
        width: 400,
        height: 300,
    },
    decorators: [
        (Story) => (
            <div style={{ width: 1000, height: 700, border: '2px dashed #999' }}>
                <Story />
            </div>
        ),
    ],
};

// MEDUSA general mode: matplotlib's `ax.hist(values, density=True)` called once for the pooled
// controls and once for a gene. Each series gets its own 10 equal-width bins, scaled so its
// bar areas sum to 1, with the gene drawn over the controls.
const medusaControls = Float64Array.from({ length: 300_000 }, () => normalSample(0, 1));
const medusaGene = Array.from({ length: 129 }, () => normalSample(-4, 0.05));

const barArea = (heights: number[], edges: number[]) =>
    heights.reduce((sum, h, i) => sum + h * (edges[i + 1] - edges[i]), 0);

export const DensityOverlay: Story = {
    name: 'Density overlay (MEDUSA general mode)',
    args: {
        data: [
            { values: medusaControls, label: 'Controls', color: '#a3a3a3' },
            { values: medusaGene, label: 'Gene', color: '#7b3294' },
        ],
        normalize: 'density',
        seriesLayout: 'overlay',
        binning: 'perSeries',
        binEdges: 'equalWidth',
        thresholds: 10,
        xLabel: 'Relative death rate (z-scored)',
        yLabel: 'Probability density',
        title: 'Density Overlay',
    },
    play: async ({ canvasElement }) => {
        const binned = binHistogram([medusaControls, medusaGene], {
            normalize: 'density', binning: 'perSeries', binEdges: 'equalWidth', thresholds: 10,
        })!;
        for (const s of binned.series) {
            expect(s.counts).toHaveLength(10);
            expect(barArea(s.heights, s.edges)).toBeCloseTo(1, 10);
        }
        // 10 bars per series plus the legend's box and two swatches
        expect(canvasElement.querySelectorAll('svg rect').length).toBe(23);
    },
};

// Expected values from `np.histogram(values, bins=10, density=True)` (numpy 1.24)
const numpyCases = [
    {
        values: [0, 0.1, 0.2, 0.30000000000000004, 0.7, 1.0],
        edges: [0, 1],
        // 0.7 lands in bin 6 because numpy's computed edge 7 is just above 0.7
        counts: [1, 1, 1, 1, 0, 0, 1, 0, 0, 1],
        density: [5 / 3, 5 / 3, 5 / 3, 5 / 3, 0, 0, 5 / 3, 0, 0, 5 / 3],
    },
    {
        values: [2, 2, 2],
        edges: [1.5, 2.5],
        counts: [0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
        density: [0, 0, 0, 0, 0, 10, 0, 0, 0, 0],
    },
    {
        values: [-1, 0, 0, 1, 3],
        edges: [-1, 3],
        counts: [1, 0, 2, 0, 0, 1, 0, 0, 0, 1],
        density: [0.5, 0, 1, 0, 0, 0.5, 0, 0, 0, 0.5],
    },
];

export const EqualWidthBins: Story = {
    args: {
        data: numpyCases[2].values,
        normalize: 'density',
        binEdges: 'equalWidth',
        xLabel: 'Value',
        yLabel: 'Density',
        title: 'Equal-Width Bins (numpy)',
    },
    play: async () => {
        for (const c of numpyCases) {
            const binned = binHistogram([c.values], { normalize: 'density', binEdges: 'equalWidth' })!;
            const [s] = binned.series;
            expect(s.counts).toEqual(c.counts);
            expect(s.edges[0]).toBe(c.edges[0]);
            expect(s.edges[10]).toBe(c.edges[1]);
            s.heights.forEach((h, i) => expect(h).toBeCloseTo(c.density[i], 10));

            const probability = binHistogram([c.values], { normalize: 'probability', binEdges: 'equalWidth' })!;
            expect(probability.series[0].heights.reduce((a, h) => a + h, 0)).toBeCloseTo(1, 10);
        }
    },
};

const largeControls = Float64Array.from({ length: 500_000 }, () => normalSample(0, 1));

export const LargeInput: Story = {
    args: {
        data: [
            { values: largeControls, label: 'Controls (500,000)', color: '#a3a3a3', opacity: 0.6 },
            { values: medusaGene, label: 'Gene (129)', color: '#7b3294' },
        ],
        normalize: 'probability',
        seriesLayout: 'overlay',
        binning: 'perSeries',
        binEdges: 'equalWidth',
        xLabel: 'Value',
        yLabel: 'Probability',
        title: 'Large Input',
    },
    play: async ({ canvasElement }) => {
        expect(canvasElement.querySelectorAll('svg rect').length).toBe(23);
    },
};

export const NormalizedStack: Story = {
    args: {
        data: [
            { values: Array.from({ length: 300 }, () => normalSample(-1, 1)), label: 'Group A', color: '#4c78a8' },
            { values: Array.from({ length: 900 }, () => normalSample(1, 1)), label: 'Group B', color: '#e45c5c' },
        ],
        normalize: 'probability',
        xLabel: 'Value',
        yLabel: 'Probability',
        title: 'Stacked, Normalized Per Series',
        thresholds: 25,
        densityLine: true,
    },
};

export const Mobile: Story = {
    tags: ['mobile', '!autodocs'],
    globals: { viewport: { value: 'iphone14', isRotated: false } },
    args: {
        ...MultiSeries.args,
        onBarClicked: fn(),
    },
    decorators: [(Story) => <div style={{ height: 300 }}><Story /></div>],
};

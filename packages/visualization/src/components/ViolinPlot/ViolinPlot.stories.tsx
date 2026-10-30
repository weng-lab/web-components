import { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { testData } from './testData';
import { Box, Typography } from '@mui/material';
import ViolinPlot from './violinPlot';

const meta = {
    title: 'visualization/ViolinPlot',
    component: ViolinPlot,
    tags: ['autodocs'],
    argTypes: {
    },
    parameters: {
        controls: { expanded: true },
    },
    decorators: [
        // Mobile stories size to the device instead - see .storybook/preview.tsx
        (Story, { tags }) => tags.includes('mobile') ? <Story /> : (
          <div style={{ width: 850, height: 500}}>
            <Story />
          </div>
        ),
      ],
} satisfies Meta<typeof ViolinPlot>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        animation: "scale",
        animationBuffer: .08
    },
};

export const Bandwidth: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        violinProps: {
            bandwidth: "scott"
        }
    },
};

export const NoOutliers: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        crossProps: {
            outliers: "none"
        }
    },
};

export const ShowPointsWithJitter: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        violinProps: {
            bandwidth: "scott",
            showAllPoints: true,
            jitter: 20
        },
    },
};

export const PointDisplayThreshold: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        violinProps: {
            pointDisplayThreshold: 7
        }
    },
};

export const CrossOnly: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        disableViolinPlot: true
    },
};

export const ViolinOnly: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        disableCrossPlot: true
    },
};

export const ViolinAndPointClick: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        violinProps: {
            showAllPoints: true,
            jitter: 20
        },
        onViolinClicked: (distribution) => {
            window.alert(`Clicked distribution: ${JSON.stringify(distribution)}`);
        },
        onPointClicked: (point) => {
            window.alert(`Clicked point: ${JSON.stringify(point)}`);
        }
    },
};

export const CustomPointTooltip: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        violinProps: {
            showAllPoints: true,
            jitter: 20
        },
        pointTooltipBody:(point) => {
            return (
                <Box sx={{ textAlign: "center", p: 1 }}>
                  <Typography>Custom Tooltip: {point.value}</Typography>
                </Box>
            );
        }
    },
};

export const CutoffValue: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        cutoffValue: 10
    },
};

// Manually sized plot. Container is 1000x700 with a dashed border - the plot
// should render at the fixed 400x300 size below, ignoring the container size.
export const ManualSize: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
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

export const Mobile: Story = {
    tags: ['mobile', '!autodocs'],
    globals: { viewport: { value: 'iphone14', isRotated: false } },
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "rightDiagonal",
        violinProps: {
            showAllPoints: true,
            jitter: 20
        },
        onViolinClicked: fn(),
        onPointClicked: fn(),
    },
    decorators: [(Story) => <div style={{ height: 360 }}><Story /></div>],
};

const MANY_TISSUES = [
    "adipose", "adrenal gland", "blood", "blood vessel", "bone", "bone marrow", "brain", "breast", "connective tissue",
    "embryo", "epithelium", "esophagus", "eye", "gallbladder", "heart", "kidney", "large intestine", "liver", "lung",
    "lymph node", "mouth", "muscle", "nerve", "nose", "ovary", "pancreas", "placenta", "prostate", "skin",
    "small intestine", "spinal cord", "spleen", "stomach", "testis", "thymus", "thyroid", "tongue", "urinary bladder",
    "uterus", "vagina",
];
const MANY_COLORS = ["#f26822", "#5eba47", "#ee2124", "#ebe71b", "#4ac2c5", "#8b7257", "#652c90", "#74cac1"];

// Seeded, so the same violins draw every time.
const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// More tissues than stand upright across a phone, as a gene's expression by tissue.
const manyDistributions = MANY_TISSUES.map((label, i) => {
    const next = seeded(i + 1);
    const center = 40 * Math.exp(-i / 8);
    return {
        label,
        violinColor: MANY_COLORS[i % MANY_COLORS.length],
        data: Array.from({ length: 6 + (i % 7) * 3 }, () => ({ value: Math.max(0, center * (0.4 + 1.2 * next())) })),
    };
});

export const MobileMany: Story = {
    tags: ['mobile', '!autodocs'],
    globals: { viewport: { value: 'iphone14', isRotated: false } },
    args: {
        distributions: manyDistributions,
        loading: false,
        axisLabel: "Expression: TPM",
        labelOrientation: "leftDiagonal",
        violinProps: {
            showAllPoints: true,
            jitter: 10
        },
        onViolinClicked: fn(),
        onPointClicked: fn(),
    },
    decorators: [(Story) => <div style={{ height: 360 }}><Story /></div>],
};

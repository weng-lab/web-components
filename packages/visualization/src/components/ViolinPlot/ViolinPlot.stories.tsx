import { Meta, StoryObj } from '@storybook/react-vite';
import ViolinPlot from './violinPlot';
import { testData } from './testData';
import { Box, Typography } from '@mui/material';

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
        (Story) => (
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
        labelOrientation: "rightDiagonal"
    },
};

export const Horizontal: Story = {
    args: {
        distributions: testData,
        loading: false,
        axisLabel: "Axis Label",
        labelOrientation: "leftDiagonal",
        horizontal: true
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
        }
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
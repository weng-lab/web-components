import Heatmap from "./Heatmap";
import { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import { ColumnDatum } from './types';

const meta = {
    title: 'visualization/Heatmap',
    component: Heatmap,
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
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

type MyMetadata = {
    description: string;
    source: string;
};
  
const heatmapData: ColumnDatum<MyMetadata>[] = Array.from({ length: 10 }, (_, colIndex) => ({
  columnNum: colIndex + 1,
  columnName: `Group ${colIndex + 1}`, 
  rows: Array.from({ length: 16 }, (_, rowIndex) => ({
    rowNum: rowIndex + 1,
    rowName: `Group ${String.fromCharCode(65 + rowIndex)}`, 
    count: Math.floor(Math.random() * 100),
  })),
}));

export const Default: Story = {
    args: {
        data: heatmapData,
        onClick: (row, column, bin) => { alert(JSON.stringify({ row, column, bin })); },
        tooltipBody: (row, column, bin) => (
        <Box maxWidth={300}>
          <div><strong>Row:</strong> {row}</div>
          <div><strong>Column:</strong> {column}</div>
          <div><strong>Value:</strong> {bin}</div>
        </Box>),
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        color1: '#20619e',
        color2: '#fff36e',
        color3: '#c92b16'
    },
};
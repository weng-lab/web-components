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

function randomString(maxLength: number) {
    const length = Math.floor(Math.random() * maxLength) + 1; // 1 to maxLength
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
      return result;
  }
  
  const heatmapData: ColumnDatum[] = Array.from({ length: 10 }, (_, colIndex) => ({
  columnNum: colIndex + 1,
  columnName: `Group ${colIndex + 1}`, 
  rows: Array.from({ length: 16 }, (_, rowIndex) => ({
    rowNum: rowIndex + 1,
    rowName: `Group ${String.fromCharCode(65 + rowIndex)}`, 
    count: Math.floor(Math.random() * 100),
  })),
}));

// Default story
export const Default: Story = {
    args: {
        data: heatmapData,
        onClick: (row, column, bin) => { alert(JSON.stringify({ row, column, bin })); },
        onHover: (hovered) => 0,
        tooltipBody: (row, column, bin) => (
        <Box maxWidth={300}>
          <div><strong>Row:</strong> {row}</div>
          <div><strong>Column:</strong> {column}</div>
          <div><strong>Value:</strong> {bin}</div>
        </Box>),
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        color1: '#122549',
        color2: '#6daedb',
    },
};
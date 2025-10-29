import Heatmap from "./Heatmap";
import { Meta, StoryObj } from '@storybook/react-vite';
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

function randomString(maxLength: number) {
    const length = Math.floor(Math.random() * maxLength) + 1; // 1 to maxLength
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
      return result;
  }
  
  const heatmapData: ColumnDatum[] = Array.from({ length: 16 }, (_, colIndex) => ({
    columnNum: colIndex + 1,
    columnName: randomString(40), 
    rows: Array.from({ length: 16 }, (_, rowIndex) => ({
      rowNum: rowIndex + 1,
      rowName: randomString(40), 
      count: Math.floor(Math.random() * 100),
    })),
  }));

// Default story
export const Default: Story = {
    args: {
        data: heatmapData,
        onClick: (row, column, bin) => { alert(JSON.stringify({ row, column, bin })); },
        color1: '#122549',
        color2: '#6daedb',
    },
};
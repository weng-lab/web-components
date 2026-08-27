import { useState } from 'react';
import Heatmap from "./Heatmap";
import { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button, Stack } from '@mui/material';
import { RowDatum, ColumnDatum, HeatmapCellId } from './types';
import type { AnyBin } from './HeatmapCells';

const meta = {
    title: 'visualization/Heatmap',
    component: Heatmap,
    tags: ['autodocs'],
    argTypes: {
        animationType: {
            control: { type: 'select' },
            options: [undefined, 'fade', 'scale', 'slideUp', 'slideRight', 'pop'],
        },
        showLegend: {
            control: { type: 'boolean' },
        },
        xLabelOrientation: {
            control: { type: 'select' },
            options: ['horizontal', 'vertical', 'leftDiagonal', 'rightDiagonal'],
        },
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
  
const heatmapData: ColumnDatum[] = Array.from(
  { length: 10 },
  (_, colIndex) =>
    ({
      columnName: `Group ${colIndex + 1}`,
      metadata: { description: "column description", source: "column source" },
      rows: Array.from(
        { length: 16 },
        (_, rowIndex) =>
          ({
            rowName: `Group ${String.fromCharCode(65 + rowIndex)}`,
            count: Math.floor(Math.random() * 100),
            metadata: { description: "row description", source: "row source" },
          } satisfies RowDatum)
      ),
    } satisfies ColumnDatum<MyMetadata>)
);

export const Default: Story = {
    args: {
        data: heatmapData,
        onClick: (bin) => console.log(bin),
        tooltipBody: (bin) => (
        <Box maxWidth={300}>
          <div><strong>Row:</strong> {bin.bin.rowName}</div>
          <div><strong>Column:</strong> {bin.datum.columnName}</div>
          <div><strong>Value:</strong> {bin?.count}</div>
        </Box>),
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        colors: ['#20619e', '#fff36e', '#c92b16'],
    },
};

export const WithAnimation: Story = {
    args: {
        data: heatmapData,
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        colors: ['#20619e', '#fff36e', '#c92b16'],
        animationType: 'scale',
    },
};

export const NoLegend: Story = {
    args: {
        data: heatmapData,
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        colors: ['#20619e', '#fff36e', '#c92b16'],
        showLegend: false,
    },
};

export const LeftDiagonalXLabels: Story = {
    args: {
        data: heatmapData,
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        colors: ['#20619e', '#fff36e', '#c92b16'],
        xLabelOrientation: 'leftDiagonal',
    },
};

// Click cells to select them - every unselected cell dims to gray while selected cells keep
// their gradient color. Click a selected cell again to remove it from the selection.
export const SelectableCells: Story = {
    render: () => {
        const [selectedCells, setSelectedCells] = useState<HeatmapCellId[]>([]);
        return (
            <Heatmap
                data={heatmapData}
                xLabel="X-Axis Label"
                yLabel="Y-Axis Label"
                colors={['#20619e', '#fff36e', '#c92b16']}
                selectedCells={selectedCells}
                onClick={(bin) => {
                    setSelectedCells((current) =>
                        current.some((cell) => cell.row === bin.row && cell.column === bin.column)
                            ? current.filter((cell) => !(cell.row === bin.row && cell.column === bin.column))
                            : [...current, { row: bin.row, column: bin.column }]
                    );
                }}
            />
        );
    },
};

// A random subset of cells have a null count - they still occupy their grid position but
// render with no fill, distinguishing "no data" from an actual 0 (colored at the gradient's low end).
const heatmapDataWithNulls: ColumnDatum[] = heatmapData.map((col) => ({
    ...col,
    rows: col.rows.map((row) => ({
        ...row,
        count: Math.random() < 0.2 ? null : row.count,
    })),
}));

export const WithNullValues: Story = {
    args: {
        data: heatmapDataWithNulls,
        tooltipBody: (bin: AnyBin) => (
        <Box maxWidth={300}>
          <div><strong>Row:</strong> {bin.bin.rowName}</div>
          <div><strong>Column:</strong> {bin.datum.columnName}</div>
          <div><strong>Value:</strong> {bin?.count ?? 'No data'}</div>
        </Box>),
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        colors: ['#20619e', '#fff36e', '#c92b16'],
    },
};

const largeHeatmapData: ColumnDatum[] = Array.from(
  { length: 60 },
  (_, colIndex) =>
    ({
      columnName: `Group ${colIndex + 1}`,
      metadata: { description: "column description", source: "column source" },
      rows: Array.from(
        { length: 80 },
        (_, rowIndex) =>
          ({
            rowName: `Row ${rowIndex + 1}`,
            count: Math.floor(Math.random() * 100),
            metadata: { description: "row description", source: "row source" },
          } satisfies RowDatum)
      ),
    } satisfies ColumnDatum<MyMetadata>)
);

export const ScrollableLargeDataset: Story = {
    args: {
        data: largeHeatmapData,
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        colors: ['#20619e', '#fff36e', '#c92b16'],
        cellWidth: 24,
        cellHeight: 18,
        xLabelOrientation: 'leftDiagonal',
    },
};

// Mimics selecting a column/row in an external table: clicking a button sets selectedCells to an
// entire column or row far outside the current scroll position. With scrollToSelection enabled,
// the grid should auto-scroll (minimal movement, "nearest" semantics) to reveal it rather than
// leaving the caller to scroll there manually.
export const ScrollToSelectionDemo: Story = {
    render: () => {
        const [selectedCells, setSelectedCells] = useState<HeatmapCellId[]>([]);
        const selectColumn = (column: number) =>
            setSelectedCells(Array.from({ length: 80 }, (_, row) => ({ row, column })));
        const selectRow = (row: number) =>
            setSelectedCells(Array.from({ length: 60 }, (_, column) => ({ row, column })));
        const addColumn = (column: number) =>
            setSelectedCells((current) => [
                ...current.filter((cell) => cell.column !== column),
                ...Array.from({ length: 80 }, (_, row) => ({ row, column })),
            ]);
        return (
            <Stack gap={2} sx={{ height: '100%' }}>
                <Stack direction="row" gap={1}>
                    <Button variant="outlined" size="small" onClick={() => selectColumn(10)}>Select Column 11</Button>
                    <Button variant="outlined" size="small" onClick={() => selectColumn(45)}>Select Column 46</Button>
                    <Button variant="outlined" size="small" onClick={() => selectRow(60)}>Select Row 61</Button>
                    <Button variant="outlined" size="small" onClick={() => addColumn(0)}>Add First Column</Button>
                    <Button variant="outlined" size="small" onClick={() => addColumn(59)}>Add Last Column</Button>
                    <Button variant="outlined" size="small" onClick={() => setSelectedCells([])}>Clear Selection</Button>
                </Stack>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <Heatmap
                        data={largeHeatmapData}
                        xLabel="X-Axis Label"
                        yLabel="Y-Axis Label"
                        colors={['#20619e', '#fff36e', '#c92b16']}
                        cellWidth={24}
                        cellHeight={18}
                        selectedCells={selectedCells}
                        scrollToSelection
                    />
                </Box>
            </Stack>
        );
    },
};

// Manually sized plot. Container is 1000x700 with a dashed border - the plot
// should render at the fixed 400x300 size below, ignoring the container size.
export const ManualSize: Story = {
    args: {
        data: heatmapData,
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        colors: ['#20619e', '#fff36e', '#c92b16'],
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
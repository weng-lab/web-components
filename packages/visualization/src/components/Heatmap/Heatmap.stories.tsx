import { useMemo, useState } from 'react';
import Heatmap from "./Heatmap";
import { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button, Stack } from '@mui/material';
import { RowDatum, ColumnDatum, HeatmapCellId, HeatmapProps } from './types';
import { Colorbar } from '../Legend/Colorbar/Colorbar';
import { evenStops, sweptValues, type RampRange } from '../Legend/colorbarAxis';
import type { AnyBin } from './HeatmapCanvasCells';

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

// Replay remounts the plot, which plays its entry animation again.
const renderWithReplay: Story['render'] = (args) => {
    const [replays, setReplays] = useState(0);
    return (
        <Stack gap={1} sx={{ height: '100%' }}>
            <Box>
                <Button variant="outlined" size="small" onClick={() => setReplays((n) => n + 1)}>Replay</Button>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <Heatmap key={replays} {...args} />
            </Box>
        </Stack>
    );
};

export const WithAnimation: Story = {
    args: {
        data: heatmapData,
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        colors: ['#20619e', '#fff36e', '#c92b16'],
        animationType: 'scale',
    },
    render: renderWithReplay,
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

// Click cells to select them - each is framed, and its row and column labels bold with a pointer at
// the axis, while every cell keeps its color. Click a selected cell again to remove it.
export const SelectableCells: Story = {
    args: {
        data: heatmapData,
        colors: ['#20619e', '#fff36e', '#c92b16'],
    },
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

// The entry animation on a grid that scrolls. Worth trying: hovering partway through, scrolling
// (which cuts it short), and smaller cells for a bigger grid.
export const ScrollableWithAnimation: Story = {
    args: {
        data: largeHeatmapData,
        xLabel: 'X-Axis Label',
        yLabel: 'Y-Axis Label',
        colors: ['#20619e', '#fff36e', '#c92b16'],
        cellWidth: 24,
        cellHeight: 18,
        animationType: 'scale',
        tooltipBody: (bin: AnyBin) => (
            <Box maxWidth={300}>
                <div><strong>Row:</strong> {bin.bin.rowName}</div>
                <div><strong>Column:</strong> {bin.datum.columnName}</div>
                <div><strong>Value:</strong> {bin?.count}</div>
            </Box>),
    },
    render: renderWithReplay,
};

// Mimics selecting a column/row in an external table: clicking a button sets selectedCells to an
// entire column or row far outside the current scroll position. With scrollToSelection enabled,
// the grid should auto-scroll (minimal movement, "nearest" semantics) to reveal it rather than
// leaving the caller to scroll there manually.
export const ScrollToSelectionDemo: Story = {
    args: {
        data: largeHeatmapData,
        colors: ['#20619e', '#fff36e', '#c92b16'],
    },
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
                        showMiniMap
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

// z-score-like counts: mostly within ±3, with a few far out in the tails. Seeded, so it's stable.
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const zRandom = seeded(7);
const normal = () => Math.sqrt(-2 * Math.log(zRandom() || 1e-9)) * Math.cos(2 * Math.PI * zRandom());
const zScoreData: ColumnDatum[] = Array.from({ length: 120 }, (_, colIndex) => ({
    columnName: `Sample ${colIndex + 1}`,
    rows: Array.from({ length: 60 }, (_, rowIndex) => ({
        rowName: `Feature ${rowIndex + 1}`,
        count: zRandom() < 0.01 ? normal() * 8 : normal(),
    })),
}));
const Z_COLORS: [string, string, ...string[]] = ['#00766c', '#70b9af', '#eeeeee', '#e0946f', '#a34604'];
const Z_DOMAIN: [number, number] = [-3, 3];

const Z_STOPS = evenStops(Z_COLORS);
const formatZ = (z: number) => z.toFixed(1);
/** Every cell's count, sorted ascending: what the colorbar's histogram and sweeps count. */
const sortedCounts = (data: ColumnDatum[]) =>
    Float64Array.from(data.flatMap(({ rows }) => rows.flatMap(({ count }) => (count === null ? [] : [count])))).sort();

/**
 * The library's Colorbar as a custom legend: sweeping it hands the heatmap the stretch of the scale
 * under the cursor, open-ended at either end to take in the clamped cells.
 */
const SweepableHeatmap = (props: Omit<HeatmapProps, 'colorDomain' | 'highlightRange' | 'legendWidth' | 'renderLegend'>) => {
    const [sweep, setSweep] = useState<RampRange | null>(null);
    const values = useMemo(() => sortedCounts(props.data), [props.data]);
    return (
        <Heatmap
            {...props}
            colorDomain={Z_DOMAIN}
            highlightRange={sweep && sweptValues(Z_DOMAIN, sweep)}
            legendWidth={56}
            renderLegend={(frame) => (
                <Colorbar
                    {...frame}
                    stops={Z_STOPS}
                    range={Z_DOMAIN}
                    values={values}
                    format={formatZ}
                    noun="cell"
                    sweep={sweep}
                    onSweep={setSweep}
                />
            )}
        />
    );
};

// Sweep the legend to fade every cell outside the window under the cursor. Click the minimap to
// expand it: the legend lies across the top there, and sweeping it works the same.
export const LegendSweepHighlight: Story = {
    args: {
        data: zScoreData,
        colors: Z_COLORS,
    },
    render: () => (
        <SweepableHeatmap
            data={zScoreData}
            xLabel="Sample"
            yLabel="Feature"
            colors={Z_COLORS}
            cellWidth={14}
            cellHeight={12}
            showMiniMap
            tooltipBody={(bin) => <Box>{bin.count?.toFixed(2)}</Box>}
        />
    ),
};

// The same legend on a grid sized to fit its container, which doesn't scroll.
export const LegendSweepHighlightStatic: Story = {
    args: {
        data: zScoreData.slice(0, 24).map((column) => ({ ...column, rows: column.rows.slice(0, 16) })),
        colors: Z_COLORS,
    },
    render: (args) => <SweepableHeatmap data={args.data} xLabel="Sample" yLabel="Feature" colors={Z_COLORS} />,
};

import { useId, useState } from 'react';
import Heatmap from "./Heatmap";
import { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button, Stack } from '@mui/material';
import { RowDatum, ColumnDatum, HeatmapCellId, HeatmapLegendFrame } from './types';
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
// z-score-like counts: mostly within ±3, with a few cells far out in the tails - the case a clamped
// colorDomain exists for. Seeded, so the story draws the same grid every time.
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

/**
 * A minimal custom legend: a bar that, swept with the cursor, hands the heatmap the stretch of the
 * scale under it. The window at either end reaches past the domain, taking in the cells the clamp
 * holds at the end color. It stands up beside the grid and lies down across the expanded minimap.
 */
const SweepLegend = ({ frame, onSweep }: { frame: HeatmapLegendFrame; onSweep: (range: [number, number] | null) => void }) => {
    const [window, setWindow] = useState<[number, number] | null>(null);
    // Per instance: the expanded minimap draws a second copy while the first stays beside the grid.
    const gradientId = `sweep-legend-${useId().replace(/:/g, "")}`;
    const horizontal = frame.orientation === "horizontal";
    // Room for a label at either end: above and below standing up, either side lying down.
    const length = Math.max(0, horizontal ? frame.width - 80 : frame.height - 40);
    const [low, high] = Z_DOMAIN;
    // Places along the bar run from 0 at its low end to 1 at its high end, whichever way it lies.
    const valueAt = (t: number) => low + t * (high - low);
    const sweep = (t: number) => {
        const from = Math.min(Math.max(t - 0.075, 0), 0.85);
        setWindow([from, from + 0.15]);
        onSweep([from <= 0 ? -Infinity : valueAt(from), from + 0.15 >= 1 ? Infinity : valueAt(from + 0.15)]);
    };
    // A stretch of the bar, and a band across it: rightward lying down, upward standing up.
    const box = (t0: number, t1: number, across: number, thickness: number) =>
        horizontal
            ? { x: t0 * length, y: across, width: (t1 - t0) * length, height: thickness }
            : { x: across, y: (1 - t1) * length, width: thickness, height: (t1 - t0) * length };
    return (
        <g transform={horizontal ? `translate(40,${frame.height / 2 - 6})` : "translate(0,20)"}>
            <defs>
                <linearGradient id={gradientId} x1="0" y1={horizontal ? "0" : "1"} x2={horizontal ? "1" : "0"} y2="0">
                    {Z_COLORS.map((color, i) => <stop key={i} offset={`${(i / (Z_COLORS.length - 1)) * 100}%`} stopColor={color} />)}
                </linearGradient>
            </defs>
            {horizontal ? (
                <>
                    <text x={-6} y={6} textAnchor="end" dominantBaseline="middle" fontSize={11} fontFamily="sans-serif">≤ {low}</text>
                    <text x={length + 6} y={6} dominantBaseline="middle" fontSize={11} fontFamily="sans-serif">≥ {high}</text>
                </>
            ) : (
                <>
                    <text x={0} y={-8} fontSize={11} fontFamily="sans-serif">≥ {high}</text>
                    <text x={0} y={length + 16} fontSize={11} fontFamily="sans-serif">≤ {low}</text>
                </>
            )}
            <rect {...box(0, 1, 0, 12)} rx={6} fill={`url(#${gradientId})`} />
            {window && <rect {...box(window[0], window[1], -3, 18)} rx={3} fill="none" stroke="#1a1c1e" strokeWidth={2} />}
            <rect
                {...box(0, 1, -8, 28)}
                fill="transparent"
                onMouseMove={(event) => {
                    const bar = event.currentTarget.getBoundingClientRect();
                    sweep(horizontal ? (event.clientX - bar.left) / bar.width : 1 - (event.clientY - bar.top) / bar.height);
                }}
                onMouseLeave={() => { setWindow(null); onSweep(null); }}
            />
        </g>
    );
};

// Sweep the legend: every cell outside the window under the cursor fades, in the grid and the
// minimap alike, so the cells of one stretch of the scale show wherever they are. The legend is the
// caller's own, through renderLegend, and a download captures it as drawn. Click the minimap to
// expand it: the legend lies across the top there, and sweeping it lights up the whole grid.
export const LegendSweepHighlight: Story = {
    args: {
        data: zScoreData,
        colors: Z_COLORS,
    },
    render: () => {
        const [highlightRange, setHighlightRange] = useState<[number, number] | null>(null);
        return (
            <Heatmap
                data={zScoreData}
                xLabel="Sample"
                yLabel="Feature"
                colors={Z_COLORS}
                colorDomain={Z_DOMAIN}
                cellWidth={14}
                cellHeight={12}
                showMiniMap
                highlightRange={highlightRange}
                legendWidth={48}
                renderLegend={(frame) => <SweepLegend frame={frame} onSweep={setHighlightRange} />}
                tooltipBody={(bin) => <Box>{bin.count?.toFixed(2)}</Box>}
            />
        );
    },
};

// The same legend on the static (unscrolled) layout, whose cells are SVG rather than canvas.
export const LegendSweepHighlightStatic: Story = {
    args: {
        data: zScoreData.slice(0, 24).map((column) => ({ ...column, rows: column.rows.slice(0, 16) })),
        colors: Z_COLORS,
    },
    render: (args) => {
        const [highlightRange, setHighlightRange] = useState<[number, number] | null>(null);
        return (
            <Heatmap
                data={args.data}
                xLabel="Sample"
                yLabel="Feature"
                colors={Z_COLORS}
                colorDomain={Z_DOMAIN}
                highlightRange={highlightRange}
                legendWidth={48}
                renderLegend={(frame) => <SweepLegend frame={frame} onSweep={setHighlightRange} />}
            />
        );
    },
};

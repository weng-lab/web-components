import ReactDOM from 'react-dom/client';
import { useRef } from 'react';
import { Box } from '@mui/material';
import { Heatmap } from './packages/visualization/src';
import type { ColumnDatum, RowDatum, DownloadPlotHandle } from './packages/visualization/src';
import { TwoPaneLayout, DataTable } from './packages/ui-components/src';
import type { DataTableColumn } from './packages/ui-components/src';

type LargeHeatmapMetadata = { description: string; source: string };

const LARGE_HEATMAP_COLS = 1000;
const LARGE_HEATMAP_ROWS = 1000;

// 1000 columns x 1000 rows (1M cells) - stress test for minimap draw performance (particularly
// expanding the minimap popup) and for the export/download path (see heatmapExport.tsx), now
// exercised through TwoPaneLayout's DownloadModal so the download icon's loading spinner can be
// checked against a real multi-second export too.
const largeHeatmapData: ColumnDatum[] = Array.from(
    { length: LARGE_HEATMAP_COLS },
    (_, colIndex) =>
        ({
            columnName: `Col ${colIndex + 1}`,
            metadata: { description: 'column description', source: 'column source' },
            rows: Array.from(
                { length: LARGE_HEATMAP_ROWS },
                (_, rowIndex) =>
                    ({
                        rowName: `Row ${rowIndex + 1}`,
                        count: Math.floor(Math.random() * 100),
                        metadata: { description: 'row description', source: 'row source' },
                    } satisfies RowDatum)
            ),
        } satisfies ColumnDatum<LargeHeatmapMetadata>)
);

// A per-cell table would be its own million-row stress test - the table pane here just
// summarizes one row per column, enough to demonstrate the paired table/plot layout.
type ColumnSummaryRow = { columnName: string; rowCount: number };

const columnSummaryRows: ColumnSummaryRow[] = largeHeatmapData.map((column) => ({
    columnName: column.columnName,
    rowCount: column.rows.length,
}));

const columnSummaryColumns: DataTableColumn<ColumnSummaryRow>[] = [
    { header: 'Column', value: (row) => row.columnName },
    { header: 'Row Count', value: (row) => row.rowCount },
];

function LargeHeatmapTest() {
    const heatmapRef = useRef<DownloadPlotHandle>(null);

    return (
        <Box sx={{ p: 2 }}>
            <TwoPaneLayout
                TableComponent={
                    <DataTable columns={columnSummaryColumns} rows={columnSummaryRows} tableTitle="Columns" dense />
                }
                plots={[
                    {
                        tabTitle: `Large Heatmap (${LARGE_HEATMAP_COLS} x ${LARGE_HEATMAP_ROWS})`,
                        plotComponent: (
                            <Heatmap
                                ref={heatmapRef}
                                data={largeHeatmapData}
                                showMiniMap
                                xLabel="X-Axis Label"
                                yLabel="Y-Axis Label"
                                colors={['#20619e', '#fff36e', '#c92b16']}
                                cellWidth={24}
                                cellHeight={18}
                                tooltipBody={(bin) => (
                                    <Box maxWidth={300}>
                                        <div><strong>Row:</strong> {bin.bin.rowName}</div>
                                        <div><strong>Column:</strong> {bin.datum.columnName}</div>
                                        <div><strong>Value:</strong> {bin?.count}</div>
                                    </Box>
                                )}
                            />
                        ),
                        onDownloadSVG: () => heatmapRef.current?.downloadSVG(),
                        onDownloadPNG: () => heatmapRef.current?.downloadPNG(),
                    },
                ]}
            />
        </Box>
    );
}

// Regression test for a heatmap given very few columns (down to just one) paired with a long
// x-axis TITLE (the xLabel prop, not a per-column tick label): the title is centered on the plot
// area (xMax), which can be much narrower than the title itself, and used to run half off the
// SVG's edge instead of being pulled back into view. Covers both the static and scrollable
// (cellWidth/cellHeight) renderers, since the fix differs between the two.
const LONG_X_AXIS_TITLE = 'This Is A Very Long X-Axis Title That Used To Run Off The Edge';

const singleColumnData: ColumnDatum[] = [
    {
        columnName: 'Col 1',
        rows: Array.from({ length: 8 }, (_, rowIndex) => ({
            rowName: `Row ${rowIndex + 1}`,
            count: Math.floor(Math.random() * 100),
        })),
    },
];

function LongXAxisTitleTest() {
    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
                <Box sx={{ mb: 1, fontWeight: 'bold' }}>static, 1 column</Box>
                <Box sx={{ border: '1px solid #ccc', display: 'inline-block' }}>
                    <Heatmap
                        data={singleColumnData}
                        colors={['#20619e', '#fff36e', '#c92b16']}
                        xLabel={LONG_X_AXIS_TITLE}
                        yLabel="Y-Axis Label"
                        width={600}
                        height={280}
                    />
                </Box>
            </Box>
            <Box>
                <Box sx={{ mb: 1, fontWeight: 'bold' }}>scrollable, 1 column</Box>
                <Box sx={{ border: '1px solid #ccc', display: 'inline-block' }}>
                    <Heatmap
                        data={singleColumnData}
                        colors={['#20619e', '#fff36e', '#c92b16']}
                        xLabel={LONG_X_AXIS_TITLE}
                        yLabel="Y-Axis Label"
                        cellWidth={24}
                        cellHeight={18}
                        width={600}
                        height={280}
                    />
                </Box>
            </Box>
        </Box>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<LongXAxisTitleTest />);

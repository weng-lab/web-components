import ReactDOM from 'react-dom/client';
import { useRef } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Heatmap } from './packages/visualization/src';
import type { ColumnDatum, RowDatum, DownloadPlotHandle } from './packages/visualization/src';

type ScrollableHeatmapMetadata = { description: string; source: string };

// 650 columns x 80 rows - large enough that fixed-size cells no longer fit the container, so the
// grid scrolls and the frozen row/column label panes + axis titles kick in.
const scrollableHeatmapData: ColumnDatum[] = Array.from(
    { length: 650 },
    (_, colIndex) =>
        ({
            columnName: `Group ${colIndex + 1}`,
            metadata: { description: 'column description', source: 'column source' },
            rows: Array.from(
                { length: 80 },
                (_, rowIndex) =>
                    ({
                        rowName: `Row ${rowIndex + 1}`,
                        count: Math.floor(Math.random() * 100),
                        metadata: { description: 'row description', source: 'row source' },
                    } satisfies RowDatum)
            ),
        } satisfies ColumnDatum<ScrollableHeatmapMetadata>)
);

function ScrollableHeatmapTest() {
    const heatmapRef = useRef<DownloadPlotHandle>(null);

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6">Scrollable Heatmap (frozen panes)</Typography>
                <Button variant="outlined" size="small" onClick={() => heatmapRef.current?.downloadSVG()}>
                    Download SVG
                </Button>
                <Button variant="outlined" size="small" onClick={() => heatmapRef.current?.downloadPNG()}>
                    Download PNG
                </Button>
            </Stack>
            <Box sx={{ width: 850, height: 500, border: '1px solid #ccc' }}>
                <Heatmap
                    ref={heatmapRef}
                    data={scrollableHeatmapData}
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
            </Box>
        </Box>
    );
}

type NonScrollingHeatmapMetadata = { description: string; source: string };

// 10 columns x 16 rows - small enough to fit the container without scrolling, so cells stretch
// to fill it (the normal, non-scrollable rendering path).
const nonScrollingHeatmapData: ColumnDatum[] = Array.from(
    { length: 10 },
    (_, colIndex) =>
        ({
            columnName: `Group ${colIndex + 1}`,
            metadata: { description: 'column description', source: 'column source' },
            rows: Array.from(
                { length: 16 },
                (_, rowIndex) =>
                    ({
                        rowName: `Group ${String.fromCharCode(65 + rowIndex)}`,
                        count: Math.floor(Math.random() * 100),
                        metadata: { description: 'row description', source: 'row source' },
                    } satisfies RowDatum)
            ),
        } satisfies ColumnDatum<NonScrollingHeatmapMetadata>)
);

function NonScrollingHeatmapTest() {
    const heatmapRef = useRef<DownloadPlotHandle>(null);

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6">Non-Scrolling Heatmap</Typography>
                <Button variant="outlined" size="small" onClick={() => heatmapRef.current?.downloadSVG()}>
                    Download SVG
                </Button>
                <Button variant="outlined" size="small" onClick={() => heatmapRef.current?.downloadPNG()}>
                    Download PNG
                </Button>
            </Stack>
            <Box sx={{ width: 850, height: 500, border: '1px solid #ccc' }}>
                <Heatmap
                    ref={heatmapRef}
                    data={nonScrollingHeatmapData}
                    xLabel="X-Axis Label"
                    yLabel="Y-Axis Label"
                    colors={['#20619e', '#fff36e', '#c92b16']}
                    tooltipBody={(bin) => (
                        <Box maxWidth={300}>
                            <div><strong>Row:</strong> {bin.bin.rowName}</div>
                            <div><strong>Column:</strong> {bin.datum.columnName}</div>
                            <div><strong>Value:</strong> {bin?.count}</div>
                        </Box>
                    )}
                />
            </Box>
        </Box>
    );
}

function TestingPage() {
    return (
        <>
            <ScrollableHeatmapTest />
            <NonScrollingHeatmapTest />
        </>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);

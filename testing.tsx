import ReactDOM from 'react-dom/client';
import { useRef } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Heatmap } from './packages/visualization/src';
import type { ColumnDatum, RowDatum, DownloadPlotHandle } from './packages/visualization/src';

type LargeHeatmapMetadata = { description: string; source: string };

const LARGE_HEATMAP_COLS = 1000;
const LARGE_HEATMAP_ROWS = 1000;

// 1000 columns x 1000 rows (1M cells) - stress test for minimap draw performance, particularly
// expanding the minimap popup.
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

function LargeHeatmapTest() {
    const heatmapRef = useRef<DownloadPlotHandle>(null);

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6">
                    Large Heatmap ({LARGE_HEATMAP_COLS} x {LARGE_HEATMAP_ROWS}) - Minimap Perf Test
                </Typography>
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
            </Box>
        </Box>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<LargeHeatmapTest />);

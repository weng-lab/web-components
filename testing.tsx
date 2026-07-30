import ReactDOM from 'react-dom/client';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { TwoPaneLayout } from './packages/ui-components/src';
import { Table } from './packages/ui-components/src';
import type { TableColDef } from './packages/ui-components/src';

const columns: TableColDef[] = [
    { field: 'gene', headerName: 'Gene', width: 120 },
    { field: 'chromosome', headerName: 'Chromosome', width: 120 },
    { field: 'start', headerName: 'Start', width: 120, type: 'number' },
    { field: 'end', headerName: 'End', width: 120, type: 'number' },
    { field: 'score', headerName: 'Score', width: 100, type: 'number' },
];

type Row = { id: number; gene: string; chromosome: string; start: number; end: number; score: number };

const mockRows: Row[] = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    gene: `GENE${String(i + 1).padStart(3, '0')}`,
    chromosome: `chr${(i % 22) + 1}`,
    start: 1_000_000 + i * 50_000,
    end: 1_050_000 + i * 50_000,
    score: Math.round(Math.random() * 1000) / 10,
}));

const QUERY_DELAY_MS = 3000;

const PlaceholderPlot = ({ label }: { label: string }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', border: '1px dashed #ccc', borderRadius: 4 }}>
        <Typography color="text.secondary">{label}</Typography>
    </div>
);

/** Inner component — fully remounts on each `mountKey` change, simulating a hard reload */
function TwoPaneTest() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const renderCount = useRef(0);
    renderCount.current += 1;

    useEffect(() => {
        const timer = setTimeout(() => {
            setRows(mockRows);
            setLoading(false);
        }, QUERY_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Box sx={{ mt: 6}}>
            <Typography variant="h6" gutterBottom>
                DEBUG: Dummy TwoPaneLayout (for height comparison)
            </Typography>
            <TwoPaneLayout
                direction={{ xs: "column", md: "row" }}
                rowHeight="700px"
                TableComponent={
                    <Box sx={{ height: "100%", background: "#eee" }}>
                        Dummy Table
                    </Box>
                }
                plots={[
                    {
                        tabTitle: "Dummy Plot",
                        plotComponent: (
                            <Box sx={{ height: "100%", background: "#ccc" }}>
                                Dummy Plot
                            </Box>
                        ),
                    },
                ]}
            />
        </Box>
    );
}

function TestingPage() {
    // Incrementing this key forces a full unmount → remount of TwoPaneTest,
    // reproducing the exact render sequence that happens on a hard browser reload.
    const [mountKey, setMountKey] = useState(0);

    return (
        <div style={{ padding: 16 }}>
            <Stack direction="row" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6">TwoPaneLayout — direction bug reproduction</Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setMountKey(k => k + 1)}
                >
                    Simulate Hard Reload
                </Button>
                <Typography variant="caption" color="text.secondary">
                    mount #{mountKey}
                </Typography>
            </Stack>

            <TwoPaneTest key={mountKey} />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);

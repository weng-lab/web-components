import ReactDOM from 'react-dom/client';
import { Heatmap } from './packages/visualization/src/components/Heatmap';
import { Box } from '@mui/material';

const data = Array.from({ length: 10 }, (_, colIndex) => ({
    columnName: `Group ${colIndex + 1}`,
    rows: Array.from({ length: 12 }, (_, rowIndex) => ({
        rowName: `Group ${String.fromCharCode(65 + rowIndex)}`,
        count: Math.floor(Math.random() * 100),
    })),
}));

function TestingPage() {
    return (
        <div style={{ width: 850, height: 500 }}>
            <Heatmap
                data={data}
                colors={['#20619e', '#fff36e', '#c92b16']}
                xLabel="X-Axis Label"
                yLabel="Y-Axis Label"
                animationType="fade"
                tooltipBody={(bin) => (
                    <Box maxWidth={300}>
                        <div><strong>Row:</strong> {bin.bin.rowName}</div>
                        <div><strong>Column:</strong> {bin.datum.columnName}</div>
                        <div><strong>Value:</strong> {bin?.count}</div>
                    </Box>
                )}
                onClick={(bin) => console.log(bin)}
            />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);

import ReactDOM from 'react-dom/client';
import { Histogram } from './packages/visualization/src/components/Histogram';

function normalSample(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const data = [
    { values: Array.from({ length: 300 }, () => normalSample(-1, 1)), label: 'Group A', color: '#4c78a8' },
    { values: Array.from({ length: 300 }, () => normalSample(1, 1)),  label: 'Group B', color: '#e45c5c' },
];

function TestingPage() {
    return (
        <div style={{ width: 800, height: 500 }}>
            <Histogram
                data={data}
                xLabel="Value"
                yLabel="Count"
                title="Multi-Series Histogram"
                distributionLine
                thresholds={25}
            />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);

import ReactDOM from 'react-dom/client';
import { BarPlot } from './packages/visualization/src/components/BarPlot';
import { BarData } from './packages/visualization/src/components/BarPlot/types';

const BAR_COUNT = 1000;

const data: BarData<unknown>[] = Array.from({ length: BAR_COUNT }, (_, index) => ({
    category: `Category ${index + 1}`,
    label: `Item ${index + 1}`,
    value: Math.round((Math.random() * 200) * 10) / 10,
    id: `bar-${index}`,
    color: '#4BC0C0',
}));

function TestingPage() {
    return (
        <div style={{ width: "60vw", height: 800, border: '1px solid gray' }}>
            <BarPlot
                data={data}
                topAxisLabel="Value"
                animation="slideRight"
                animationBuffer={0.01}
            />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);

import React, { useImperativeHandle, useState } from 'react';
import { TooltipWithBounds } from '@visx/tooltip';
import { HistogramBin } from './types';

export interface HistogramTooltipHandle {
    show: (bin: HistogramBin, left: number, top: number) => void;
    hide: () => void;
}

interface HistogramTooltipProps {
    multiSeries: boolean;
    tooltipBody?: (bin: HistogramBin) => React.ReactElement;
    ref: React.Ref<HistogramTooltipHandle>;
}

const HistogramTooltip = ({ multiSeries, tooltipBody, ref }: HistogramTooltipProps) => {
    const [state, setState] = useState<{ open: boolean; data?: HistogramBin; left?: number; top?: number }>({ open: false });

    useImperativeHandle(ref, () => ({
        show: (bin, left, top) => setState({ open: true, data: bin, left, top }),
        hide: () => setState((s) => ({ ...s, open: false })),
    }));

    if (!state.open || !state.data) return null;

    const { data, left, top } = state;

    return (
        <TooltipWithBounds left={left} top={top}>
            {tooltipBody ? (
                tooltipBody(data)
            ) : (
                <div style={{ fontSize: 12 }}>
                    <div>
                        <strong>Range:</strong> {data.x0.toFixed(2)}, {data.x1.toFixed(2)}
                    </div>
                    {multiSeries ? (
                        data.series.map((s) => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color, display: 'inline-block' }} />
                                <span><strong>{s.label}:</strong> {s.count}</span>
                            </div>
                        ))
                    ) : (
                        <div><strong>Count:</strong> {data.count}</div>
                    )}
                </div>
            )}
        </TooltipWithBounds>
    );
};

export default HistogramTooltip;

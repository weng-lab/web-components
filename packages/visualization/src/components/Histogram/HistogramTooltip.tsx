import React from 'react';
import { TooltipWithBounds } from '@visx/tooltip';
import { HistogramBin } from './types';

interface HistogramTooltipProps {
    open: boolean;
    data: HistogramBin | undefined;
    left: number | undefined;
    top: number | undefined;
    multiSeries: boolean;
    tooltipBody?: (bin: HistogramBin) => React.ReactElement;
}

const HistogramTooltip = ({ open, data, left, top, multiSeries, tooltipBody }: HistogramTooltipProps) => {
    if (!open || !data) return null;

    return (
        <TooltipWithBounds left={left} top={top}>
            {tooltipBody ? (
                tooltipBody(data)
            ) : (
                <div style={{ fontFamily: 'Roboto,Helvetica,Arial,sans-serif', fontSize: 12 }}>
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

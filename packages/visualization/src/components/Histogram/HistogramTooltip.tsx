import React from 'react';
import { HistogramBin, HistogramNormalize } from './types';

interface HistogramTooltipProps {
    data: HistogramBin;
    multiSeries: boolean;
    normalize: HistogramNormalize;
    tooltipBody?: (bin: HistogramBin) => React.ReactElement;
}

const normalizeLabels: Record<HistogramNormalize, string> = {
    count: 'Count',
    probability: 'Probability',
    density: 'Density',
};

const formatHeight = (v: number) => `${Number(v.toPrecision(4))}`;

/** What a bin's tooltip says, in the histogram's PlotTooltip. */
const HistogramTooltip = ({ data, multiSeries, normalize, tooltipBody }: HistogramTooltipProps) => {
    const normalized = normalize !== 'count';
    const singleValue = data.series[0]?.value;

    return (
        <>
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
                                <span>
                                    <strong>{s.label}:</strong> {s.count}
                                    {normalized && s.value !== undefined && ` (${normalizeLabels[normalize].toLowerCase()} ${formatHeight(s.value)})`}
                                </span>
                            </div>
                        ))
                    ) : (
                        <>
                            <div><strong>Count:</strong> {data.count}</div>
                            {normalized && singleValue !== undefined && (
                                <div><strong>{normalizeLabels[normalize]}:</strong> {formatHeight(singleValue)}</div>
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default HistogramTooltip;

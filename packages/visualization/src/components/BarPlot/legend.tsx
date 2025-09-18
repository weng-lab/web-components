import React, { useRef } from "react";
import { LollipopLegendProps } from "./types";
import { getTextHeight } from "./barplot";

const Legend: React.FC<LollipopLegendProps> = ({
    label,
    getlollipopRadius,
    height,
    width,
    legendValues,
    spaceForCategory,
    axisCenter,
    loading
}) => {
    const gap = 30;
    const labelRef = useRef<SVGTextElement>(null);

    const labelWidth = getTextHeight(label, 12, "Times")

    const itemWidths = legendValues.map(v => getlollipopRadius(v) * 2 + 12);
    const totalItemsWidth =
        itemWidths.reduce((sum, w) => sum + w, 0) + gap * (legendValues.length - 1);

    const dividerGap = 10;

    const totalWidth = labelWidth + dividerGap * 2 + totalItemsWidth;

    return (
        <div style={{ marginBottom: 10, opacity: loading ? 0.3 : 1 }}>
            <svg height={height + 4} width={width + labelWidth + 4} id="legend" transform={`translate(${spaceForCategory / 1.2 + axisCenter - width / 2}, 0)`}>
                <rect height={height} width={width + labelWidth} stroke="black" fill="none" transform={`translate(2, 2)`} />
                {loading ? (
                    <text
                        x={(width + labelWidth) / 2}
                        y={height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={12}
                        fill="black"
                    >
                        Loading...
                    </text>
                ) : (
                    <>
                        <g transform={`translate(${(width / 2 - totalWidth / 2) + 2}, ${(height / 2) + 2})`}>
                            <text
                                ref={labelRef}
                                x={0}
                                y={3}
                                textAnchor="start"
                                fill="black"
                                fontSize={12}
                            >
                                {label}
                            </text>
                        </g>
                        <g transform={`translate(${(width / 2 - totalWidth / 2 + labelWidth + dividerGap) + 2}, ${(height / 2) + 2})`}>
                            <line
                                x1={0}
                                y1={-height / 2}
                                x2={0}
                                y2={height / 2}
                                stroke="black"
                                strokeWidth={1}
                            />
                            <g transform={`translate(${dividerGap + labelWidth / 2}, 0)`}>
                                {legendValues.map((value, idx) => {
                                    const circleR = getlollipopRadius(value);
                                    const offsetX =
                                        itemWidths.slice(0, idx).reduce((sum, w) => sum + w, 0) +
                                        idx * gap;

                                    return (
                                        <g key={`legend${idx}`} transform={`translate(${offsetX}, 0)`}>
                                            <circle r={circleR} cx={0} cy={0} fill="black" />
                                            <text
                                                x={circleR + 12}
                                                y={3}
                                                textAnchor="start"
                                                fill="black"
                                                fontSize={10}
                                            >
                                                {value}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        </g>
                    </>
                )}

            </svg>
        </div>
    );
};

export default Legend;

import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { LollipopLegendProps } from "./types";
import { getTextHeight } from "./barplot";

const Legend: React.FC<LollipopLegendProps> = ({
    label,
    getlollipopRadius,
    height,
    width,
    legendValues,
    spaceForCategory
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
        <div
            style={{
                width: `calc(100% - ${spaceForCategory}px)`,
                justifyContent: "center",
                display: "flex",
                marginBottom: 10
            }}
        >
            <svg height={height} width={width + labelWidth} id="legend">
                <rect height={height} width={width + labelWidth} stroke="black" fill="none" />
                <g transform={`translate(${width / 2 - totalWidth / 2}, ${height / 2})`}>
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
                <g
                    transform={`translate(${width / 2 - totalWidth / 2 + labelWidth + dividerGap}, ${height / 2
                        })`}
                >
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
                                <g key={idx} transform={`translate(${offsetX}, 0)`}>
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
            </svg>

        </div>
    );
};

export default Legend;

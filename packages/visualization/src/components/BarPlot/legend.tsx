import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { LollipopLegendProps } from "./types";

const Legend: React.FC<LollipopLegendProps> = ({
    label,
    getLolipopRadius,
    height,
    width,
    legendValues,
    spaceForCategory
}) => {
    const gap = 30;
    const labelRef = useRef<SVGTextElement>(null);
    const [labelWidth, setLabelWidth] = useState(0);

    useEffect(() => {
        if (labelRef.current) {
            setLabelWidth(labelRef.current.getBBox().width);
        }
    }, [label]);

    const itemWidths = legendValues.map(v => getLolipopRadius(v) * 2 + 12);
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
            <svg height={height} width={width} id="legend">
                <rect height={height} width={width} stroke="black" fill="none" />
                <g transform={`translate(${(width - totalWidth) / 2}, ${height / 2})`}>
                    <text
                        ref={labelRef}
                        x={-8}
                        y={3}
                        textAnchor="start"
                        fill="black"
                        fontSize={12}
                    >
                        {label}
                    </text>
                    <line
                        x1={labelWidth + dividerGap}
                        y1={-height}
                        x2={labelWidth + dividerGap}
                        y2={height}
                        stroke="black"
                        strokeWidth={1}
                    />
                    <g transform={`translate(${labelWidth + dividerGap * 2}, 0)`}>
                        {legendValues.map((value, idx) => {
                            const circleR = getLolipopRadius(value);
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

import React from "react";
import { LollipopLegendProps } from "./types";

const Legend: React.FC<LollipopLegendProps> = ({
    label,
    getLolipopRadius,
    height,
    width,
    legendValues
}) => {
    const gap = 30; // horizontal gap between items

    const itemWidths = legendValues.map(v => getLolipopRadius(v) * 2 + 12);
    const totalWidth =
        itemWidths.reduce((sum, w) => sum + w, 0) + gap * (legendValues.length - 1);

    return (
        <div style={{ width: "100%", justifyContent: "center", display: "flex" }}>
            <svg height={height} width={width} id="legend">
                <rect height={height} width={width} stroke="black" fill="none" />
                <text
                    x={width / 2}
                    y={15}
                    textAnchor="middle"
                    fill="black"
                    fontSize={12}
                >
                    {label}
                </text>
                <g transform={`translate(${(width - totalWidth) / 2}, ${height / 1.5})`}>
                    {legendValues.map((value, idx) => {
                        const circleR = getLolipopRadius(value);
                        // X position relative to group start
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
            </svg>
        </div>
    );
};

export default Legend;

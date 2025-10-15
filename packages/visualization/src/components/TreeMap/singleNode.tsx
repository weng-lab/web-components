import React from "react";
import { SingleNodeProps } from "./types";
import ValueOval from "./valueOval";
import { getLabelPlacement, measureTextWidth, truncateTextToWidth } from "./utility";

const SingleNode: React.FC<SingleNodeProps> = ({
    node,
    isHovered,
    onHover,
    strokeWidth,
    borderRadius = 0,
    labelPlacement
}) => {
    const fontSize = 16
    const nodeColor = node.data.color || "black";
    const stroke = isHovered ? strokeWidth + 2 : strokeWidth;


    const width = node.x1 - node.x0;
    const height = node.y1 - node.y0;

    const fullLabel = node.data.label;
    const truncatedLabel = truncateTextToWidth(fullLabel, width - 8, fontSize, "sans-serif");
    const showText = height > 55;

    const { textX, textY, anchor, baseline, valueY } = getLabelPlacement(
        node,
        labelPlacement,
    );

    return (
        <g
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            style={{ cursor: "pointer", transition: "stroke-width 0.2s" }}
        >
            <rect
                x={node.x0}
                y={node.y0}
                width={width}
                height={height}
                fill={nodeColor}
                fillOpacity={0.3}
                stroke={nodeColor}
                strokeWidth={stroke}
                rx={borderRadius}
            />
            {showText && (
                <>
                    <text
                        x={textX}
                        y={textY}
                        textAnchor={anchor}
                        dominantBaseline={baseline}
                        fill={nodeColor}
                        fontWeight={500}
                    >
                        {truncatedLabel}
                    </text>
                    <ValueOval
                        cx={textX}
                        cy={valueY}
                        color={nodeColor}
                        value={node.data.value}
                        align={anchor}
                    />
                </>
            )}
        </g>
    );
};

export default SingleNode;

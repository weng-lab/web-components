import React from "react";
import { SingleNodeProps } from "./types";
import ValueOval from "./valueOval";

const SingleNode: React.FC<SingleNodeProps> = ({
    node,
    isHovered,
    onHover,
    strokeWidth,
    borderRadius = 0,
}) => {
    const nodeColor = node.data.color || "black";
    const stroke = isHovered ? strokeWidth + 2 : strokeWidth;

    const width = node.x1 - node.x0;
    const height = node.y1 - node.y0;
    const cx = (node.x0 + node.x1) / 2;
    const cy = (node.y0 + node.y1) / 2;

    const showText = width > 40 && height > 40;

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
                        x={cx}
                        y={cy - 5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={nodeColor}
                        fontWeight={500}
                    >
                        {node.data.label}
                    </text>
                    <ValueOval cx={cx} cy={cy + 15} color={nodeColor} value={node.data.value} />
                </>
            )}
        </g>
    );
};

export default SingleNode;

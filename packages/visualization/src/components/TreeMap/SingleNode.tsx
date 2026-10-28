import { SingleNodeProps, TreemapNode } from "./types";
import ValueOval from "./ValueOval";
import { getLabelPlacement, truncateTextToWidth } from "./helpers";
import { useCallback } from "react";
import React from "react";
import { HierarchyRectangularNode } from "@visx/hierarchy";

const SingleNode = <T,>(
    props: SingleNodeProps<T>
) => {
    function getNodeValue(node: HierarchyRectangularNode<TreemapNode<T>>): number {
        // If the node has children, sum their values
        if (node.children && node.children.length > 0) {
            return node.children.reduce((sum: number, child) => {
                return sum + getNodeValue(child);
            }, 0);
        }

        // Otherwise use the leaf's data value
        return node.data.value ?? 0;
    }

    const hasChildren = props.node.children !== undefined && props.node.children.length > 0;
    
    const value = hasChildren ? props.node.data.displayValue ?? getNodeValue(props.node) : props.node.data.value ?? 0

    const fontSize = props.fontSize
    const nodeColor = props.node.data.style?.color ||  props.node.parent?.data.style?.color || "black"
    const labelColor = props.node.data.style?.labelColor || nodeColor;
    const nodeStrokeColor = props.node.data.style?.strokeColor || nodeColor;
    const nodeStroke = props.node.data.style?.strokeWidth === 0 ? 0 : props.node.data.style?.strokeWidth || props.strokeWidth;
    const stroke = props.isHovered ? nodeStroke + 2 : nodeStroke;

    const width = props.node.x1 - props.node.x0;
    const height = props.node.y1 - props.node.y0;

    const fullLabel = props.node.data.label;
    const truncatedLabel = truncateTextToWidth(fullLabel, width - 8, fontSize, "sans-serif");
    const showValue = height > 55 && width > 50 && value > 0;
    const showText = height > 20;

    const { textX, textY, textAnchor, valueAnchor, baseline, valueY, valueX } = getLabelPlacement(
        props.node,
        props.labelPlacement,
        showValue,
        hasChildren
    );

    const { tooltipRef } = props;
    const handleMouseMove = useCallback(
        (event: React.MouseEvent<SVGElement>) => tooltipRef.current?.show(props.node.data, event),
        [tooltipRef, props.node.data]
    );

    const handleNodeClick = () => {
        if (!props.onNodeClicked) return;
        props.onNodeClicked(props.node.data);
    };

    return (
        <React.Fragment key={`frag-${props.node.data.label}`}>
            <g
                onMouseEnter={() => props.onHover(true)}
                onMouseLeave={() => {
                    props.onHover(false);
                    tooltipRef.current?.hide();
                }}
                onMouseMove={handleMouseMove}
                onClick={handleNodeClick}
                style={{ cursor: "pointer", transition: "stroke-width 0.2s" }}
            >
                <rect
                    x={props.node.x0}
                    y={props.node.y0}
                    width={width}
                    height={height}
                    fill={nodeColor}
                    fillOpacity={props.opacity}
                    stroke={nodeStrokeColor}
                    strokeWidth={stroke}
                    rx={props.borderRadius}
                />
                {showText && (
                    <text
                        x={textX}
                        y={textY}
                        textAnchor={textAnchor}
                        dominantBaseline={baseline}
                        fill={labelColor}
                        fontSize={props.fontSize}
                        fontWeight={500}
                    >
                        {truncatedLabel}
                    </text>
                )}
                {showValue && (
                    <ValueOval
                        cx={valueX}
                        cy={valueY}
                        color={labelColor}
                        value={value}
                        align={valueAnchor}
                    />
                )}
            </g>
        </React.Fragment>
    );
};

export default SingleNode;
import { SingleNodeProps } from "./types";
import ValueOval from "./ValueOval";
import { getLabelPlacement, truncateTextToWidth } from "./helpers";
import { ReactNode, useCallback } from "react";
import { Portal, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import React from "react";

const SingleNode = <T,>(
    props: SingleNodeProps<T>
) => {
    const isChild = props.node.parent !== undefined && props.node.parent?.data.label !== "root";
    const hasChildren = props.node.children !== undefined && props.node.children.length > 0;

    const fontSize = props.fontSize
    const nodeColor = isChild ? props.node.parent?.data.style?.color || "black" : props.node.data.style?.color || "black";
    const labelColor = props.node.data.style?.labelColor || nodeColor;
    const nodeStrokeColor = props.node.data.style?.strokeColor || nodeColor;
    const nodeStroke = props.node.data.style?.strokeWidth === 0 ? 0 : props.node.data.style?.strokeWidth || props.strokeWidth;
    const stroke = props.isHovered ? nodeStroke + 2 : nodeStroke;

    const width = props.node.x1 - props.node.x0;
    const height = props.node.y1 - props.node.y0;

    const fullLabel = props.node.data.label;
    const truncatedLabel = truncateTextToWidth(fullLabel, width - 8, fontSize, "sans-serif");
    const showValue = height > 55 && width > 50;
    const showText = height > 20;

    const { textX, textY, textAnchor, valueAnchor, baseline, valueY, valueX } = getLabelPlacement(
        props.node,
        props.labelPlacement,
        showValue,
        hasChildren
    );

    const {
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
        showTooltip,
        hideTooltip,
    } = useTooltip<ReactNode>();

    const handleMouseMove = useCallback(
        (event: React.MouseEvent<SVGElement>) => {
            if (!props.tooltipBody) return;

            const tooltipContent = props.tooltipBody(props.node.data);

            showTooltip({
                tooltipLeft: event.clientX + 10,
                tooltipTop: event.clientY + 10,
                tooltipData: tooltipContent,
            });
        },
        [props.tooltipBody, props.node.data, showTooltip]
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
                    hideTooltip?.();
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
                        value={props.node.data.value}
                        align={valueAnchor}
                    />
                )}
            </g>
            {props.tooltipBody && tooltipOpen && tooltipData && (
                <Portal>
                    <TooltipWithBounds left={(tooltipLeft ?? 0) + 10} top={tooltipTop}>
                        {tooltipData}
                    </TooltipWithBounds>
                </Portal>
            )}
        </React.Fragment>
    );
};

export default SingleNode;
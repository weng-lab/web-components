import { SingleNodeProps } from "./types";
import ValueOval from "./tempValueOval";
import { getLabelPlacement, truncateTextToWidth } from "./helpers";
import { ReactNode, useCallback } from "react";
import { Portal, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import React from "react";

const SingleNode = <T,>(
    props: SingleNodeProps<T>
) => {
    const fontSize = props.fontSize
    const nodeColor = props.node.data.color || "black";
    const stroke = props.isHovered ? props.strokeWidth + 2 : props.strokeWidth;

    const width = props.node.x1 - props.node.x0;
    const height = props.node.y1 - props.node.y0;

    const fullLabel = props.node.data.label;
    const truncatedLabel = truncateTextToWidth(fullLabel, width - 8, fontSize, "sans-serif");
    const showValue = height > 55 && width > 50;
    const showText = height > 20;

    const { textX, textY, anchor, baseline, valueY } = getLabelPlacement(
        props.node,
        props.labelPlacement,
        showValue
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
                    fillOpacity={0.3}
                    stroke={nodeColor}
                    strokeWidth={stroke}
                    rx={props.borderRadius}
                />
                {showText && (
                    <text
                        x={textX}
                        y={textY}
                        textAnchor={anchor}
                        dominantBaseline={baseline}
                        fill={nodeColor}
                        fontSize={props.fontSize}
                        fontWeight={500}
                    >
                        {truncatedLabel}
                    </text>
                )}
                {showValue && (
                    <ValueOval
                        cx={textX}
                        cy={valueY}
                        color={nodeColor}
                        value={props.node.data.value}
                        align={anchor}
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

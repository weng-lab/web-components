import React, { useCallback, useRef } from "react";
import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { BarData, SingleBarProps } from "./types";
import { defaultStyles as defaultTooltipStyles, useTooltip, TooltipWithBounds, Portal } from '@visx/tooltip';
import { Bar, Circle } from "@visx/shape";
import { getAnimationProps } from "../../utility";
import { motion } from "framer-motion";

const fontFamily = "Roboto,Helvetica,Arial,sans-serif"

const SingleBar = <T,>({
    index,
    bar,
    onBarClicked,
    TooltipContents,
    cutoffNegativeValues,
    negativeCutoff,
    xScale,
    yScale,
    barSize,
    barSpacing,
    gapBetweenTextAndBar,
    getLollipopRadius,
    animation,
    animationEnabled,
    animationBuffer,
    uniqueID
}: SingleBarProps<T>) => {
    const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } = useTooltip<BarData<T>>({});

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGGElement, MouseEvent>, data: BarData<T>) => {
        showTooltip({
            tooltipData: data,
            tooltipLeft: event.pageX,
            tooltipTop: event.pageY,
        });
    }, [ showTooltip]);

    const hovered = bar.id === tooltipData?.id;

    const pointValue = cutoffNegativeValues ? Math.max(bar.value, negativeCutoff) : bar.value;

    // Shared values
    const bandPos = yScale(bar.id);
    const bandSize = bar.id.split("-")[0] === "spacer" ? barSpacing : barSize;

    // Bar geometry
    const barX = (pointValue > 0 ? xScale(0) : xScale(pointValue))

    const barY = (bandPos ?? 0)

    const barWidth = Math.abs(xScale(pointValue) - xScale(0))

    const barHeight = bar.id.split("-")[0] === "spacer" ? barSpacing : barSize

    // Label positions
    const categoryLabelX = -gapBetweenTextAndBar

    const categoryLabelY = (bandPos ?? 0) + bandSize / 2

    const valueLabelX = barX + barWidth + gapBetweenTextAndBar + (bar.lollipopValue && bar.value >= 0 ? getLollipopRadius(bar.lollipopValue) : 0)

    const valueLabelY = barY + barHeight / 2

    const Wrapper = animation && animationEnabled ? motion.g : "g";
    const animProps = getAnimationProps(animation, index, animationBuffer ?? .03);

    return (
        <React.Fragment key={`frag-${index}`}>
            <Group
                key={index}
                onClick={() => onBarClicked?.(bar)}
                style={onBarClicked && { cursor: 'pointer' }}
                onMouseMove={(event) => handleMouseMove(event, bar)}
                onMouseLeave={() => hideTooltip()}
                fontFamily={fontFamily}
            >
                {/* Category label */}
                <Text
                    x={categoryLabelX}
                    y={categoryLabelY}
                    dy={".35em"}
                    textAnchor={"end"}
                    fill="black"
                    fontSize={12}
                >
                    {bar.category}
                </Text>
                <Wrapper key={`node-${index}`} {...animProps}>
                    <Group>
                        <Bar
                            key={`bar-${bar.label}`}
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={barHeight}
                            fill={bar.color || "black"}
                            opacity={cutoffNegativeValues && pointValue === negativeCutoff ? 0.4 : 1}
                            rx={3}
                            stroke={hovered ? "black" : "none"}
                        />
                        {bar.lollipopValue && (
                            <>
                                <Circle
                                    r={getLollipopRadius(bar.lollipopValue) * 1.5}
                                    cx={bar.value < 0 ? barX : barX + barWidth}
                                    cy={barY + barHeight / 2}
                                    fill={bar.color}
                                    stroke={hovered ? "black" : "none"}
                                />
                                <Circle
                                    r={getLollipopRadius(bar.lollipopValue)}
                                    cx={bar.value < 0 ? barX : barX + barWidth}
                                    cy={barY + barHeight / 2}
                                    fill='black'
                                />
                            </>
                        )}
                        {/* Value label */}
                        <Text
                            id={`label-${index}-${uniqueID}`}
                            x={valueLabelX}
                            y={valueLabelY}
                            dy={".35em"}
                            textAnchor={"start"}
                            fill="black"
                            fontSize={12}
                        >
                            {bar.label}
                        </Text>
                    </Group>
                </Wrapper>
            </Group>
            {/* Maybe should provide a default tooltip */}
            {TooltipContents && tooltipOpen && (
                <Portal>
                    <TooltipWithBounds
                        top={tooltipTop}
                        left={tooltipLeft}
                        style={{ ...defaultTooltipStyles, backgroundColor: '#283238', color: 'white', zIndex: 1000 }}
                    >
                        {tooltipData && (
                            <TooltipContents {...tooltipData as BarData<T>} />
                        )}
                    </TooltipWithBounds>
                </Portal>
            )}
        </React.Fragment>
    )
}

export default SingleBar;
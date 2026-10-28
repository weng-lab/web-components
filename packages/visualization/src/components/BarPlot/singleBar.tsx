import React, { memo, useCallback, useState } from "react";
import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { SingleBarProps } from "./types";
import { Bar, Circle } from "@visx/shape";
import { getAnimationProps } from "../../utility";
import { motion } from "framer-motion";

const fontFamily = "Roboto,Helvetica,Arial,sans-serif"

const SingleBar = <T,>({
    index,
    bar,
    onBarClicked,
    tooltipRef,
    tap,
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
}: SingleBarProps<T>) => {
    // Only whether this bar is hovered is state here, and it changes on entering and leaving the
    // bar. The tooltip's position is PlotTooltip's own, so moving across a bar re-renders nothing.
    const [hovered, setHovered] = useState(false);

    const handleMouseEnter = useCallback(() => {
        setHovered(true);
        tap.hover(bar);
    }, [tap, bar]);

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGGElement>) => {
        tooltipRef.current?.show(bar, event);
    }, [tooltipRef, bar]);

    const handleClick = useCallback(() => {
        if (tap.activates(bar)) onBarClicked?.(bar);
    }, [onBarClicked, bar, tap]);

    const handleMouseLeave = useCallback(() => {
        setHovered(false);
        tap.hover(null);
        tooltipRef.current?.hide();
    }, [tooltipRef, tap]);

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
        <Group
            onClick={handleClick}
            style={onBarClicked && { cursor: 'pointer' }}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
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
            <Wrapper {...animProps}>
                <Group>
                    <Bar
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        fill={bar.color || "black"}
                        opacity={cutoffNegativeValues && pointValue === negativeCutoff ? 0.4 : 1}
                        rx={3}
                        stroke={hovered ? "black" : (bar.stroke || "none")}
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
    )
}

// memo() doesn't preserve generic type parameters, so cast back to the generic signature
export default memo(SingleBar) as typeof SingleBar;
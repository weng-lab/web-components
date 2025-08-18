import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bar, Circle } from '@visx/shape';
import { scaleBand, scaleLinear, scaleLog } from '@visx/scale';
import { AxisTop } from '@visx/axis';
import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { useParentSize } from '@visx/responsive';
import { defaultStyles as defaultTooltipStyles, useTooltip, TooltipWithBounds as VisxTooltipWithBounds, Portal as VisxPortal } from '@visx/tooltip';
import { PortalProps } from '@visx/tooltip/lib/Portal';
import { TooltipWithBoundsProps } from '@visx/tooltip/lib/tooltips/TooltipWithBounds';
import { CircularProgress } from '@mui/material';
import { BarData, BarPlotProps } from './types';
import { NumberValue } from '@visx/vendor/d3-scale';
import Legend from './legend';

const fontFamily = "Roboto,Helvetica,Arial,sans-serif"

//helper function to get the approx length of the longest category in px
const getTextHeight = (text: string, fontSize: number, fontFamily: string): number => {
    const el = document.createElement("g");
    el.style.position = "absolute";
    el.style.visibility = "hidden";
    el.style.fontSize = `${fontSize}px`;
    el.style.fontFamily = fontFamily;
    el.style.whiteSpace = "nowrap";
    el.textContent = text;
    document.body.appendChild(el);
    const width = el.getBoundingClientRect().width;
    document.body.removeChild(el);
    return width + 10;
};

const BarPlot = <T,>({
    data,
    SVGref,
    topAxisLabel,
    onBarClicked,
    TooltipContents,
    show95thPercentileLine = false,
    cutoffNegativeValues = false,
    barSize = 15,
    barSpacing = 2,
    fill = false,
    legnedTitle,
    legendValues = [1, 0.05, 0.01, 0.001]
}: BarPlotProps<T>) => {
    const [spaceForLabel, setSpaceForLabel] = useState(200)
    const [labelSpaceDecided, setLabelSpaceDecided] = useState(false)
    // Unique ID needed to not mix up getElementByID calls if multiple charts are in DOM
    const [uniqueID] = useState(topAxisLabel + String(Math.random()))
    const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } = useTooltip<BarData<T>>({});
    const requestRef = useRef<number | null>(null);
    const tooltipDataRef = useRef<{ top: number; left: number; data: BarData<T> } | null>(null);

    /**
     * Hacky workaround for complex type compatability issues. Hopefully this will fix itself when ugrading to React 19 - Jonathan 12/11/24
     * @todo remove this when possible
     */
    const Portal = VisxPortal as unknown as React.FC<PortalProps>;
    const TooltipWithBounds = VisxTooltipWithBounds as unknown as React.FC<TooltipWithBoundsProps>;

    const outerSvgRef = useRef<SVGSVGElement>(null)

    const handleMouseMove = useCallback((event: React.MouseEvent, barData: BarData<T>) => {
        tooltipDataRef.current = {
            top: event.pageY,
            left: event.pageX,
            data: barData,
        };
        if (!requestRef.current) {
            requestRef.current = requestAnimationFrame(() => {
                if (tooltipDataRef.current) {
                    showTooltip({
                        tooltipTop: tooltipDataRef.current.top,
                        tooltipLeft: tooltipDataRef.current.left,
                        tooltipData: tooltipDataRef.current.data,
                    });
                }
                requestRef.current = null;
            });
        }
    }, [showTooltip]);

    const { parentRef, width: ParentWidth, height: ParentHeight } = useParentSize({ debounceTime: 150 });

    const lolipopValues = data
        .map(d => d.lolipopValue)
        .filter((v): v is number => v !== undefined);

    const rScaleAdjustment = 0.005

    /**
     * Scale for the radius of the FDR circle. Use getFDRradius instead of this directly to avoid going outside of the domain
     */
    const rScale = useMemo(() =>
        scaleLog<number>({
            base: 10,
            domain: [rScaleAdjustment, 1], // Min/Max of fdr values in data
            range: [10, 2],
            round: true,
        }),
        []
    )

    /**
     * 
     * @param x 
     * @returns rScale(Math.max(0.005, x)) to avoid the very large values near 0
     */
    const getLolipopRadius = useCallback((x: number) => rScale(Math.max(rScaleAdjustment, x)), [rScale])

    // Y padding
    const spaceForTopAxis = 50
    const spaceOnBottom = 20
    const legendHeight = lolipopValues.length > 0 ? 50 : 0

    // X padding
    const maxCategoryLength = Math.max(...data.map(d => getTextHeight(d.category ?? "", 12, "Arial")))
    const spaceForCategory = maxCategoryLength
    const gapBetweenTextAndBar = 10

    const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data])
    const minValue = useMemo(() => Math.min(...data.map((d) => d.value)), [data])
    const negativeCutoff = -0.5

    const bars = data.flatMap((item, index) => [
        item,
        {
            id: `spacer-${index}`,
            value: 0,
            color: "transparent",
        }
    ]).slice(0, -1);

    const dataHeight = ((data.length) * (barSize)) + ((data.length - 1) * (barSpacing))
    const totalHeight = fill ? ParentHeight - spaceForTopAxis - spaceOnBottom - legendHeight : dataHeight

    // Scales
    const yScale = useMemo(() =>
        scaleBand<string>({
            domain: bars.map((d) => d.id),
            range: [0, totalHeight],
            paddingOuter: 0.5,
        }), [bars, totalHeight])

    const xScale = useMemo(() =>
        scaleLinear<number>({
            domain: [
                // If cutting off negative values, the lower bound is max(negativeCutoff, minValue).
                cutoffNegativeValues ? Math.min(0, Math.max(minValue, negativeCutoff)) : Math.min(0, minValue),
                // Make some room past the last tick (7% of the range of the data)
                Math.max(0, maxValue) + 0.07 * (maxValue - minValue)
            ], // always include 0 as anchor if values do not cross 0
            range: [0, Math.max(ParentWidth - spaceForCategory - spaceForLabel, 0)],
        }), [cutoffNegativeValues, minValue, negativeCutoff, maxValue, ParentWidth, spaceForLabel])

    //This feels really dumb but I couldn't figure out a better way to have the labels not overflow sometimes - JF 11/8/24
    //Whenever xScale is adjusted, it checks to see if any of the labels overflow the container, and if so
    //it sets the spaceForLabel to be the amount overflowed.
    useEffect(() => {
        if (!ParentWidth) { return }

        let maxOverflow = 0
        let minUnderflow: number | null = null

        bars.forEach((d, i) => {
            const textElement = document.getElementById(`label-${i}-${uniqueID}`) as unknown as SVGSVGElement;

            if (textElement) {
                const textWidth = textElement.getBBox().width;
                const barWidth = xScale(d.value);

                const totalWidth = spaceForCategory + barWidth + gapBetweenTextAndBar + textWidth
                const overflow = totalWidth - ParentWidth

                maxOverflow = Math.max(overflow, maxOverflow)
                if (overflow < 0) {
                    if (minUnderflow === null) {
                        minUnderflow = Math.abs(overflow)
                    } else {
                        minUnderflow = Math.min(Math.abs(overflow), minUnderflow)
                    }
                }
            }
        });

        if (maxOverflow > 0) { //ensure nothing is cut off
            setLabelSpaceDecided(false)
            setSpaceForLabel((prev) => {
                return prev + 25
            })
        } else if (minUnderflow && minUnderflow > 30) { //ensure not too much space is left empty
            setLabelSpaceDecided(false)
            setSpaceForLabel((prev) => {
                return prev - 25
            })
        } else { //If there is no overflow or underflow to handle
            setLabelSpaceDecided(true)
        }

    }, [data, xScale, spaceForLabel, labelSpaceDecided, SVGref, ParentWidth, topAxisLabel, uniqueID]);

    return (
        // Min width of 500 to ensure that on mobile the calculated bar width is not negative
        <div ref={parentRef} style={{ minWidth: '500px', height: '100%', }}>
            {lolipopValues.length > 0 && (
                <Legend values={lolipopValues} label={legnedTitle ?? ""} getLolipopRadius={getLolipopRadius} height={legendHeight} width={250} legendValues={legendValues} />
            )}
            {data.length === 0 ?
                <p>No Data To Display</p>
                :
                <svg
                    //define fallback ref if not passed through props
                    ref={(node) => {
                        if (SVGref && node) {
                            SVGref.current = node;
                        }
                        outerSvgRef.current = node;
                    }}
                    width={ParentWidth}
                    height={fill ? ParentHeight - legendHeight : totalHeight + spaceForTopAxis + spaceOnBottom}
                    opacity={(labelSpaceDecided && ParentWidth > 0) ? 1 : 0.3}
                >
                    <Group left={spaceForCategory} top={spaceForTopAxis}>
                        {/* Top Axis with Label */}
                        <AxisTop
                            scale={xScale}
                            top={0}
                            label={topAxisLabel}
                            labelProps={{ dy: -5, fontSize: 14, fontFamily }}
                            numTicks={ParentWidth < 700 ? 4 : undefined}
                            tickFormat={(value: NumberValue, index: number) => {
                                const num = typeof value === 'number' ? value : value.valueOf();

                                if (index === 0 && num < 0 && cutoffNegativeValues && data.some(d => d.value <= negativeCutoff)) {
                                    return "Low Signal";
                                } else {
                                    return num.toString();
                                }
                            }}
                        />

                        {bars.map((d, i) => {
                            const hovered = d.id === tooltipData?.id;

                            const pointValue = cutoffNegativeValues ? Math.max(d.value, negativeCutoff) : d.value;

                            // Shared values
                            const bandPos = yScale(d.id);
                            const bandSize = d.id.split("-")[0] === "spacer" ? barSpacing : barSize;

                            // Bar geometry
                            const barX = (pointValue > 0 ? xScale(0) : xScale(pointValue))

                            const barY = (bandPos ?? 0)

                            const barWidth = Math.abs(xScale(pointValue) - xScale(0))

                            const barHeight = d.id.split("-")[0] === "spacer" ? barSpacing : barSize

                            // Label positions
                            const categoryLabelX = -gapBetweenTextAndBar

                            const categoryLabelY = (bandPos ?? 0) + bandSize / 2

                            const valueLabelX = barX + barWidth + gapBetweenTextAndBar + (d.lolipopValue ? getLolipopRadius(d.lolipopValue) : 0)

                            const valueLabelY = barY + barHeight / 2

                            return (
                                <Group
                                    key={i}
                                    onClick={() => onBarClicked?.(d)}
                                    style={onBarClicked && { cursor: 'pointer' }}
                                    onMouseMove={(event) => handleMouseMove(event, d)}
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
                                        {d.category}
                                    </Text>
                                    <Group>
                                        <Bar
                                            key={`bar-${d.label}`}
                                            x={barX}
                                            y={barY}
                                            width={barWidth}
                                            height={barHeight}
                                            fill={d.color || "black"}
                                            opacity={cutoffNegativeValues && pointValue === negativeCutoff ? 0.4 : 1}
                                            rx={3}
                                            stroke={hovered ? "black" : "none"}
                                        />
                                        {d.lolipopValue && (
                                            <>
                                                <Circle
                                                    r={getLolipopRadius(d.lolipopValue) * 1.5}
                                                    cx={barX + barWidth}
                                                    cy={barY + barHeight / 2}
                                                    fill={d.color}
                                                    stroke={hovered ? "black" : "none"}
                                                />
                                                <Circle
                                                    r={getLolipopRadius(d.lolipopValue)}
                                                    cx={barX + barWidth}
                                                    cy={barY + barHeight / 2}
                                                    fill='black'
                                                />
                                            </>
                                        )}
                                        {/* Value label */}
                                        <Text
                                            id={`label-${i}-${uniqueID}`}
                                            x={valueLabelX}
                                            y={valueLabelY}
                                            dy={".35em"}
                                            textAnchor={"start"}
                                            fill="black"
                                            fontSize={12}
                                        >
                                            {d.label}
                                        </Text>
                                    </Group>
                                </Group>
                            );
                        })}
                        <>
                            <line
                                x1={xScale(0)}
                                x2={xScale(0)}
                                y1={0}
                                y2={totalHeight}
                                stroke="#000000"
                            />
                        </>
                        {show95thPercentileLine && xScale.domain()[1] > 1.645 &&
                            <line
                                x1={xScale(1.645)}
                                x2={xScale(1.645)}
                                y1={0}
                                y2={totalHeight}
                                stroke={"black"}
                                strokeDasharray={'5 7'}
                            />
                        }
                    </Group>
                </svg>
            }
            {/* Loading Wheel for resizing */}
            {!labelSpaceDecided &&
                <div style={{ display: "flex", position: "absolute", inset: 0, justifyContent: "center" }}>
                    <CircularProgress sx={{ mt: 10 }} />
                </div>
            }
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
        </div>
    );
};

export default BarPlot;
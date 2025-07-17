import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bar } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
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

const fontFamily = "Roboto,Helvetica,Arial,sans-serif"
const fontSize = 14

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
    barSize,
    sortByCategory = false
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

    const { parentRef, width: ParentWidth } = useParentSize({ debounceTime: 150 });


    // Y padding
    const spaceForTopAxis = 50
    const spaceOnBottom = 20

    // X padding
    const maxCategoryLength = Math.max(...data.map(d => getTextHeight(d.category ?? "", fontSize, "Arial")))
    const spaceForCategory = maxCategoryLength
    const gapBetweenTextAndBar = 10

    const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data])
    const minValue = useMemo(() => Math.min(...data.map((d) => d.value)), [data])
    const negativeCutoff = -0.5

    //Sort categories and include spacers for invisible bars between each category
    const sortedCategories = useMemo(() => {
        if (!sortByCategory) return data;

        const sorted = [...data].sort((a, b) =>
            (a.category ?? "").localeCompare(b.category ?? "")
        );

        const result: typeof data = [];
        let prevCategory: string | null = null;
        let spacerIndex = 0;

        for (const item of sorted) {
            const currCategory = item.category ?? '';
            if (prevCategory !== null && prevCategory !== currCategory) {
                result.push({
                    id: `__spacer-${spacerIndex++}`,
                    category: currCategory,
                    label: '',
                    value: 0,
                    color: 'transparent',
                });
            }
            result.push(item);
            prevCategory = currCategory;
        }

        return result;
    }, [data, sortByCategory]);

    const bars = sortByCategory ? sortedCategories : data;

    /**
     * @todo why is this not working as expected. Was 30 in SCREEN, why does it need to be 15 here?
     * figure out a better way to increase bar size other than just a factor of 4 + 15, kind of dumb @matt
     */
    const dataHeight = bars.length * (15 + (barSize ?? 0) * 4)
    const totalHeight = dataHeight + spaceForTopAxis + spaceOnBottom

    // Scales
    const yScale = useMemo(() =>
        scaleBand<string>({
            domain: bars.map((d) => d.id),
            range: [0, dataHeight],
            padding: 0.15,
        }), [bars, dataHeight])

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

    //Find where each category label would go when sorting by categories
    const categoryLabels = useMemo(() => {
        if (!sortByCategory) return [];

        const barsByCategory = bars.reduce<Record<string, BarData<T>[]>>((acc, bar) => {
            if (typeof bar.id === "string" && bar.id.startsWith("__spacer")) {
                return acc; // Skip spacer bars
            }

            const key = bar.category ?? '';
            if (!acc[key]) acc[key] = [];
            acc[key].push(bar);
            return acc;
        }, {});

        return Object.entries(barsByCategory).map(([category, groupBars]) => {
            const topY = Math.min(...groupBars.map(b => yScale(b.id) ?? 0));
            const bottomY = Math.max(...groupBars.map(b => (yScale(b.id) ?? 0) + yScale.bandwidth()));
            const midY = topY + (bottomY - topY) / 2;

            return {
                category,
                y: midY
            };
        });
    }, [bars, yScale, sortByCategory]);


    //This feels really dumb but I couldn't figure out a better way to have the labels not overflow sometimes - JF 11/8/24
    //Whenever xScale is adjusted, it checks to see if any of the labels overflow the container, and if so
    //it sets the spaceForLabel to be the amount overflowed.
    useEffect(() => {
        if (!ParentWidth) { return }

        let maxOverflow = 0
        let minUnderflow: number | null = null

        data.forEach((d, i) => {
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
        <div ref={parentRef} style={{ minWidth: '500px' }}>
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
                    height={totalHeight}
                    opacity={(labelSpaceDecided && ParentWidth > 0) ? 1 : 0.3}
                >
                    <Group left={spaceForCategory} top={spaceForTopAxis} >
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

                            const pointValue = cutoffNegativeValues ? Math.max(d.value, negativeCutoff) : d.value
                            const barHeight = yScale.bandwidth()
                            const barWidth = Math.abs(xScale(pointValue) - xScale(0))
                            const barY = yScale(d.id)
                            const barX = pointValue > 0 ? xScale(0) : xScale(pointValue)

                            return (
                                <Group
                                    key={i}
                                    onClick={() => onBarClicked && onBarClicked(d)}
                                    style={onBarClicked && { cursor: 'pointer' }}
                                    onMouseMove={(event) => handleMouseMove(event, d)}
                                    onMouseLeave={() => hideTooltip()}
                                    fontFamily={fontFamily}
                                >
                                    {/* Category label to the left of each bar */}
                                    {!sortByCategory && (
                                        <Text
                                            x={-gapBetweenTextAndBar}  // Positioning slightly to the left of the bar
                                            y={(barY ?? 0) + barHeight / 2}
                                            dy=".35em"
                                            textAnchor="end"
                                            fill="black"
                                            fontSize={12}
                                        >
                                            {d.category}
                                        </Text>
                                    )}
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
                                        {/* Value label next to the bar */}
                                        <Text
                                            id={`label-${i}-${uniqueID}`}
                                            x={barX + barWidth + gapBetweenTextAndBar}  // Position label slightly after the end of the bar
                                            y={(barY ?? 0) + barHeight / 2}
                                            dy=".35em"  // Vertically align to the middle of the bar
                                            fill="black"
                                            fontSize={12}
                                        >
                                            {d.label}
                                        </Text>
                                    </Group>
                                </Group>
                            );
                        })}
                        {sortByCategory && categoryLabels.map(({ category, y }, i) => (
                            <Text
                                key={`category-${i}`}
                                x={-gapBetweenTextAndBar}
                                y={y}
                                dy=".35em"
                                textAnchor="end"
                                fill="black"
                                fontSize={12}
                                fontFamily={fontFamily}
                            >
                                {category}
                            </Text>
                        ))}
                        <line
                            x1={xScale(0)}
                            x2={xScale(0)}
                            y1={0}
                            y2={dataHeight}
                            stroke="#000000"
                        />
                        {show95thPercentileLine && xScale.domain()[1] > 1.645 &&
                            <line
                                x1={xScale(1.645)}
                                x2={xScale(1.645)}
                                y1={0}
                                y2={dataHeight}
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
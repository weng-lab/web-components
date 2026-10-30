import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { scaleBand, scaleLinear, scaleLog } from '@visx/scale';
import { AxisTop } from '@visx/axis';
import { Group } from '@visx/group';
import { CircularProgress, useTheme } from '@mui/material';
import { BarData, BarPlotProps } from './types';
import { NumberValue } from '@visx/vendor/d3-scale';
import Legend from './legend';
import { downloadAsSVG, downloadSVGAsPNG, measureTextWidth } from '../../utility';
import { useResponsiveParentSize } from '../../responsive';
import { PlotTooltip, type PlotTooltipHandle } from '../../tooltip';
import SingleBar from './singleBar';
import { useTapToActivate } from '../../hooks';
import { PinnedAxisScroller } from '../../controls';

const fontFamily = "Roboto,Helvetica,Arial,sans-serif"

//helper function to get the approx length of the longest category in px
export const getTextHeight = (text: string, fontSize: number, fontFamily: string): number => {
    return measureTextWidth(text, fontSize, fontFamily) + 10;
};

const BarPlot = <T,>({
    data,
    ref,
    topAxisLabel,
    onBarClicked,
    TooltipContents,
    show95thPercentileLine = false,
    cutoffNegativeValues = false,
    barSize = 15,
    barSpacing = 2,
    fill = false,
    maxLabelShare = 0.5,
    legendTitle = "FDR",
    legendValues = [1, 0.05, 0.01, 0.001],
    downloadFileName,
    animation,
    animationBuffer,
    width,
    height
}: BarPlotProps<T>) => {
    const [spaceForLabel, setSpaceForLabel] = useState(200)
    const [labelSpaceDecided, setLabelSpaceDecided] = useState(false)

    // The rows on show, in order. framer-motion plays a bar's entry animation only when the bar mounts,
    // so the bars are remounted under this key whenever it changes - otherwise a row shared with the
    // previous data keeps its mounted bar and skips the animation the new rows get.
    const rowsKey = useMemo(() => JSON.stringify(data.map((d) => d.id)), [data])

    // Scrolling turns the animation off, so that if scrolling too fast through a long list of bars you
    // don't have to wait for the animation to catch up. Held against the rows that were scrolled, so
    // the next set of rows animates in again.
    const [animationDisabledFor, setAnimationDisabledFor] = useState<string | null>(null);
    const animationEnabled = animationDisabledFor !== rowsKey;

    const theme = useTheme();
    const tooltipRef = useRef<PlotTooltipHandle<BarData<unknown>>>(null);
    const tap = useTapToActivate<BarData<unknown>>();

    const svgRef = useRef<SVGSVGElement | null>(null);

    const outerSvgRef = useRef<SVGSVGElement>(null)
    const { parentRef, node, containerStyle, width: ParentWidth, height: ParentHeight } = useResponsiveParentSize({ width, height }, { debounceTime: 150 });

    useEffect(() => {
        if (!node) return;

        // Where these rows start out scrolled to. Rows shorter than the last ones make the browser clamp
        // the scroll position, and the scroll event it fires for that is not the user scrolling - so only
        // a scroll that moves away from here turns the animation off. Reading the position lays out the
        // new rows first, so it is the clamped one.
        const startTop = node.scrollTop;
        const startLeft = node.scrollLeft;

        const handleScroll = () => {
            if (node.scrollTop === startTop && node.scrollLeft === startLeft) return;
            setAnimationDisabledFor(rowsKey);
            node.removeEventListener("scroll", handleScroll);
        };

        node.addEventListener("scroll", handleScroll);

        return () => node.removeEventListener("scroll", handleScroll);
    }, [node, rowsKey]);

    const lollipopValues = data
        .map(d => d.lollipopValue)
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
    const getlollipopRadius = useCallback((x: number) => rScale(Math.max(rScaleAdjustment, x)), [rScale])

    // Y padding
    const spaceForTopAxis = 50
    const spaceOnBottom = 20
    const legendHeight = lollipopValues.length > 0 ? 30 : 0
    // The legend over the bars, its margin included. A measured height is the bars' own, under it; one
    // given takes the legend in.
    const legendSpace = lollipopValues.length > 0 && height !== undefined ? legendHeight + 14 : 0
    const barsHeight = ParentHeight - legendSpace

    // X padding
    const spaceForCategory = useMemo(() =>
        Math.max(...data.map(d => getTextHeight(d.category ?? "", 12, fontFamily))),
        [data])
    const gapBetweenTextAndBar = 10

    const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data])
    const minValue = useMemo(() => Math.min(...data.map((d) => d.value)), [data])
    const negativeCutoff = -0.5

    const bars = useMemo(() => data.flatMap((item, index) => [
        item,
        {
            id: `spacer-${index}`,
            value: 0,
            color: "transparent",
        }
    ]).slice(0, -1), [data]);

    const dataHeight = ((data.length) * (barSize)) + ((data.length - 1) * (barSpacing))
    const totalHeight = fill ? barsHeight - spaceForTopAxis - spaceOnBottom : dataHeight

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
                cutoffNegativeValues ? Math.min(0, Math.max(minValue, negativeCutoff)) : Math.min(0, minValue - 0.07 * (0 - minValue)),
                // Make some room past the last tick (7% of the range of the data) if the data isnt all negative
                 Math.max(maxValue, 0) + (maxValue > 0 ? 0.07 * maxValue : 0),
            ], // always include 0 as anchor if values do not cross 0
            range: [0, Math.max(ParentWidth - spaceForCategory - spaceForLabel, 0)],
        }), [cutoffNegativeValues, minValue, negativeCutoff, maxValue, ParentWidth, spaceForLabel])

    //Figures out how much horizontal space the value labels need so they don't overflow (or leave too much empty space).
    //Solved directly from the scale's domain (which doesn't depend on spaceForLabel), so it converges in a single pass
    //instead of repeatedly nudging spaceForLabel by +/-25px and re-rendering every bar each time.
    useEffect(() => {
        if (!ParentWidth) { return }

        const availableWidth = ParentWidth - spaceForCategory
        const [domainMin, domainMax] = xScale.domain()
        const domainSpan = domainMax - domainMin

        let requiredSpace = 0

        if (domainSpan > 0) {
            bars.forEach((d) => {
                const textWidth = measureTextWidth((d as BarData<T>).label ?? "", 12, fontFamily);

                // Position of the bar's far edge as a fraction of availableWidth, independent of spaceForLabel
                const fraction = Math.max(0 - domainMin, d.value - domainMin) / domainSpan

                if (fraction > 0) {
                    const needed = (availableWidth * (fraction - 1) + gapBetweenTextAndBar + textWidth) / fraction
                    requiredSpace = Math.max(requiredSpace, needed)
                }
            });
        }

        const newSpaceForLabel = Math.max(0, Math.min(Math.ceil(requiredSpace), Math.floor(availableWidth * maxLabelShare)))

        if (Math.abs(newSpaceForLabel - spaceForLabel) > 1) {
            setLabelSpaceDecided(false)
            setSpaceForLabel(newSpaceForLabel)
        } else {
            setLabelSpaceDecided(true)
        }

    }, [bars, xScale, spaceForCategory, spaceForLabel, ParentWidth, maxLabelShare]);

    const axisCenter = (xScale.range()[0] + xScale.range()[1]) / 2;

    const topAxis = (
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
    );
    // Held over the bars as they scroll beneath it.
    const pinnedAxis = !fill && data.length > 0;
    const settled = labelSpaceDecided && ParentWidth > 0;

    //Download the plot as svg or png using the passed ref from the parent
    useImperativeHandle(ref, () => ({
        downloadSVG: () => {
            if (svgRef.current) downloadAsSVG(svgRef.current, downloadFileName ?? "bar_plot.svg");
        },
        downloadPNG: () => {
            if (svgRef.current) downloadSVGAsPNG(svgRef.current, downloadFileName ?? "bar_plot.png");
        },
    }));

    return (
        <div style={{ ...containerStyle, display: "flex", flexDirection: "column" }}>
            {lollipopValues.length > 0 && (
                <Legend
                    values={lollipopValues}
                    label={legendTitle}
                    getlollipopRadius={getlollipopRadius}
                    height={legendHeight}
                    width={300}
                    legendValues={legendValues}
                    spaceForCategory={spaceForCategory}
                    axisCenter={axisCenter}
                    loading={!labelSpaceDecided || ParentWidth < 0}
                />
            )}
            {/* The bars scroll here, under the legend. */}
            <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
                <PinnedAxisScroller
                    scrollerRef={parentRef}
                    scroller={node}
                    pinned={pinnedAxis}
                    width={ParentWidth}
                    axisHeight={spaceForTopAxis}
                    axis={<Group left={spaceForCategory} top={spaceForTopAxis}>{topAxis}</Group>}
                    opacity={settled ? 1 : 0.3}
                >
                    {data.length === 0 ?
                        <p>No Data To Display</p>
                        :
                        <svg
                            //define fallback ref if not passed through props
                            ref={(node) => {
                                if (svgRef && node) {
                                    svgRef.current = node;
                                }
                                outerSvgRef.current = node;
                            }}
                            width={ParentWidth}
                            height={fill ? barsHeight : totalHeight + spaceForTopAxis + spaceOnBottom}
                            opacity={settled ? 1 : 0.3}
                            style={{ display: "block" }}
                        >
                            <Group left={spaceForCategory} top={spaceForTopAxis}>
                                {/* Top Axis with Label */}
                                <g className="pinned-axis">{topAxis}</g>

                                {/* Keyed by the rows on show, so every bar remounts, and replays its entry animation, when they
                                    change. Without an animation there is nothing to replay, so the bars are kept. */}
                                <React.Fragment key={animation ? rowsKey : undefined}>
                                    {bars.map((d, i) => (
                                        <SingleBar
                                            key={d.id}
                                            bar={d}
                                            index={i}
                                            onBarClicked={onBarClicked as unknown as ((bar: BarData<unknown>) => void) | undefined}
                                            tooltipRef={tooltipRef}
                                            tap={tap}
                                            cutoffNegativeValues={cutoffNegativeValues}
                                            negativeCutoff={negativeCutoff}
                                            xScale={xScale}
                                            yScale={yScale}
                                            barSize={barSize}
                                            barSpacing={barSpacing}
                                            gapBetweenTextAndBar={gapBetweenTextAndBar}
                                            getLollipopRadius={getlollipopRadius}
                                            labelRight={ParentWidth - spaceForCategory}
                                            animation={animation}
                                            animationEnabled={animationEnabled}
                                            animationBuffer={animationBuffer}
                                        />
                                    ))}
                                </React.Fragment>
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
                </PinnedAxisScroller>
            </div>
            {TooltipContents && (
                // Matches the MUI tooltip layer, as ScatterPlot's does, so the portalled tooltip
                // sits above the overlays of whatever page the plot is placed in.
                <PlotTooltip ref={tooltipRef} zIndex={theme.zIndex.tooltip}>
                    {(bar) => <TooltipContents {...bar as BarData<T>} />}
                </PlotTooltip>
            )}
            {/* Loading Wheel for resizing */}
            {!labelSpaceDecided &&
                <div style={{ display: "flex", position: "absolute", inset: 0, justifyContent: "center" }}>
                    <CircularProgress sx={{ mt: 10 }} />
                </div>
            }
        </div>
    );
};

export default BarPlot;
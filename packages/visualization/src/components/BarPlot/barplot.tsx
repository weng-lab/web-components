import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { scaleBand, scaleLinear, scaleLog } from '@visx/scale';
import { AxisTop } from '@visx/axis';
import { Group } from '@visx/group';
import { useParentSize } from '@visx/responsive';
import { CircularProgress } from '@mui/material';
import { BarData, BarPlotProps } from './types';
import { NumberValue } from '@visx/vendor/d3-scale';
import Legend from './legend';
import { downloadAsSVG, downloadSVGAsPNG, measureTextWidth } from '../../utility';
import SingleBar from './singleBar';

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
    legendTitle = "FDR",
    legendValues = [1, 0.05, 0.01, 0.001],
    downloadFileName,
    animation,
    animationBuffer
}: BarPlotProps<T>) => {
    const [spaceForLabel, setSpaceForLabel] = useState(200)
    const [labelSpaceDecided, setLabelSpaceDecided] = useState(false)
    // State to control whether animation is enabled so that if scrollling too fast through a long list of bars, 
    // you dont have to wait for the animation to catch up
    const [animationEnabled, setAnimationEnabled] = useState(true);

    const svgRef = useRef<SVGSVGElement | null>(null);

    const outerSvgRef = useRef<SVGSVGElement>(null)
    const { parentRef, width: ParentWidth, height: ParentHeight } = useParentSize({ debounceTime: 150 });

    useEffect(() => {
        const el = parentRef.current;
        if (!el) return;

        const handleScroll = () => setAnimationEnabled(false);

        el.addEventListener("scroll", handleScroll, { once: true });

        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

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

    // X padding
    const spaceForCategory = useMemo(() =>
        Math.max(...data.map(d => getTextHeight(d.category ?? "", 12, "Arial"))),
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

        const newSpaceForLabel = Math.max(0, Math.ceil(requiredSpace))

        if (Math.abs(newSpaceForLabel - spaceForLabel) > 1) {
            setLabelSpaceDecided(false)
            setSpaceForLabel(newSpaceForLabel)
        } else {
            setLabelSpaceDecided(true)
        }

    }, [bars, xScale, spaceForCategory, spaceForLabel, ParentWidth]);

    const axisCenter = (xScale.range()[0] + xScale.range()[1]) / 2;

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
        // Min width of 500 to ensure that on mobile the calculated bar width is not negative
        <div ref={parentRef} style={{ minWidth: '500px', height: '100%', overflow: 'auto'}}>
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
                    height={fill ? ParentHeight ? ParentHeight - legendHeight : ParentHeight : totalHeight + spaceForTopAxis + spaceOnBottom}
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

                            return (
                                <SingleBar
                                    key={d.id}
                                    bar={d}
                                    index={i}
                                    onBarClicked={onBarClicked as unknown as ((bar: BarData<unknown>) => void) | undefined}
                                    TooltipContents={TooltipContents as unknown as ((bar: BarData<unknown>) => React.ReactNode) | undefined}
                                    cutoffNegativeValues={cutoffNegativeValues}
                                    negativeCutoff={negativeCutoff}
                                    xScale={xScale}
                                    yScale={yScale}
                                    barSize={barSize}
                                    barSpacing={barSpacing}
                                    gapBetweenTextAndBar={gapBetweenTextAndBar}
                                    getLollipopRadius={getlollipopRadius}
                                    animation={animation}
                                    animationEnabled={animationEnabled}
                                    animationBuffer={animationBuffer}
                                />
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
        </div>
    );
};

export default BarPlot;
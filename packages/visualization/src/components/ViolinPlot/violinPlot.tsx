import { Distribution, TooltipData, ViolinPlotProps } from "./types";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AxisLeft, AxisBottom, AxisTop } from '@visx/axis';
import { useImperativeHandle, useMemo, useRef } from "react";
import { useTheme } from "@mui/material";
import { Text } from '@visx/text';
import { getTextHeight } from "./helpers";
import SingleViolin from "./singleViolin";
import ViolinTooltip from "./violinTooltip";
import { downloadAsSVG, downloadSVGAsPNG, getAnimationProps } from "../../utility";
import { useResponsiveParentSize } from "../../responsive";
import { motion } from "framer-motion";
import { useTapToActivate } from "../../hooks";
import { PinnedAxisScroller } from "../../controls";
import { PlotTooltip, type PlotTooltipHandle } from "../../tooltip";

/** The least room, in px, a violin on its side gets down the plot: its band and the gap to the next. */
const MIN_ROW_STEP = 26;
/** Room over violins on their sides for the value axis, its ticks and its label. */
const TOP_AXIS_SPACE = 56;
const BOTTOM_SPACE = 12;
/** Room past the value axis's end, for its last tick label. */
const RIGHT_SPACE = 24;
/** The least room, in px, between value ticks across violins on their sides. */
const MIN_TICK_SPACING = 60;
/** The shortest, in px, "auto" lets upright violins stand under their labels before laying them on their sides. */
const MIN_UPRIGHT_HEIGHT = 120;
/** How far apart, in ems, upright violins' rotated labels' lines of text must be not to run into each other. */
const LABEL_CLEARANCE = 0.85;

const ViolinPlot = <T extends object>(
    props: ViolinPlotProps<T>,
) => {
    const { parentRef, node, containerStyle, width: parentWidth, height: parentHeight } = useResponsiveParentSize({ width: props.width, height: props.height });
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tap = useTapToActivate<string>();
    const theme = useTheme();
    const tooltipRef = useRef<PlotTooltipHandle<TooltipData<T>>>(null);

    //Array of labels fo xDomain
    const labels = useMemo(() => {
        return props.distributions.map((x, i) => x.label ?? `Group ${i + 1}`);
    }, [props.distributions]);

    const baseOffset = 40;
    const fontSize = 15;

    const orientation = props.orientation ?? (props.horizontal === undefined ? "auto" : props.horizontal ? "horizontal" : "vertical");
    // Upright, the room each violin gets across the plot, and how tall they'd stand under their labels.
    const uprightStep = useMemo(() =>
        scaleBand<string>({ range: [0, Math.max(parentWidth - 2 * baseOffset, 0)], domain: labels, padding: 0.4 }).step(),
        [parentWidth, labels]);
    const uprightLabels = props.labelOrientation ?? "horizontal";
    const longestLabel = useMemo(() =>
        labels.length ? Math.max(...labels.map(label => getTextHeight(label, fontSize, "Arial"))) : 0,
        [labels]);
    const uprightLabelHeight = uprightLabels === "horizontal" ? fontSize : longestLabel / (uprightLabels !== "vertical" ? 1.25 : 1);
    const uprightHeight = parentHeight - uprightLabelHeight - 2 * baseOffset;
    // The room each needs for its label not to run into the next: as wide as the longest, reading across;
    // rotated, enough to keep their lines of text LABEL_CLEARANCE ems apart - on a diagonal that's the
    // room times sin 45°.
    const labelStep = uprightLabels === "horizontal" ? longestLabel
        : uprightLabels === "vertical" ? LABEL_CLEARANCE * fontSize
        : LABEL_CLEARANCE * fontSize / Math.SQRT1_2;
    const turned = orientation === "auto" && parentWidth > 0 && parentHeight > 0
        && (uprightStep < labelStep || uprightHeight < MIN_UPRIGHT_HEIGHT);
    const horizontal = orientation === "horizontal" || turned;

    const labelOrientation = turned ? "horizontal" : uprightLabels

    const cutoffLine = props.cutoffLine ?? "none"

    //If the label orientation is anything but horizontal, find the max height of the elements, otherwise set to fontsize
    const maxLabelHeight = horizontal
        ? labelOrientation === "vertical" ? fontSize : longestLabel / (labelOrientation !== "horizontal" ? 1.25 : 1)
        : uprightLabelHeight;

    const offset = horizontal ? labelOrientation !== "vertical" ? maxLabelHeight / 1.75 : maxLabelHeight : baseOffset;

    // bounds
    const vertXMax = parentWidth - 2 * offset;
    const vertYMax = parentHeight - maxLabelHeight - 2 * offset;
    const horizonXMax = parentWidth - 2 * offset - RIGHT_SPACE;
    // The rows fill the plot's height, or run past it to scroll where they can't each get MIN_ROW_STEP.
    const horizonYMax = Math.max(parentHeight - TOP_AXIS_SPACE - BOTTOM_SPACE, labels.length * MIN_ROW_STEP);

    //all values from data spread out based on count
    const allValues: number[] = props.distributions.flatMap(x =>
        x.data.flatMap(d => d.value)
    );

    const minYValue = Math.min(...allValues);
    const maxYValue = Math.max(...allValues);

    const cutoffValue = props.cutoffValue ?? minYValue

    // scales
    const vertXScale = useMemo(() => {
        return scaleBand<string>({
            range: [0, vertXMax],
            round: true,
            domain: labels,
            padding: 0.4,
        });
    }, [vertXMax, labels]);

    const vertYScale = useMemo(() => {
        const padding = .07 * (maxYValue - (Math.max(minYValue, cutoffValue)))
        return scaleLinear<number>({
            range: [vertYMax, 0],
            round: true,
            // Make the bottom most tick 7% of the domain less so that there is room between the lowest plot and the bottom axis
            domain: [(Math.max(minYValue, cutoffValue)) - padding, maxYValue + padding],
        });
    }, [vertYMax, minYValue, maxYValue, cutoffValue]);

    const horizonXScale = useMemo(() => {
        const padding = .07 * (maxYValue - (Math.max(minYValue, cutoffValue)))
        return scaleLinear<number>({
            range: [0, horizonXMax],
            round: true,
            // Make the bottom most tick 7% of the domain less so that there is room between the lowest plot and the bottom axis
            domain: [(Math.max(minYValue, cutoffValue)) - padding, maxYValue + padding],
        });
    }, [horizonXMax, minYValue, maxYValue, cutoffValue]);

    const horizonYScale = useMemo(() => {
        return scaleBand<string>({
            range: [0, horizonYMax],
            round: true,
            domain: labels,
            padding: 0.4,
        });
    }, [horizonYMax, labels]);


    const valueScale = horizontal ? horizonXScale : vertYScale;
    const labelScale = horizontal ? horizonYScale : vertXScale;

    const axisLabel = horizontal ? (
        <Text
            textAnchor="middle"
            verticalAnchor="start"
            fontSize={fontSize}
            y={4 - TOP_AXIS_SPACE}
            x={horizonXMax / 2 + offset}
        >
            {props.axisLabel}
        </Text>
    ) : (
        <Text
            textAnchor="middle"
            verticalAnchor="end"
            angle={-90}
            fontSize={fontSize}
            y={vertYMax / 2}
            x={-10}
        >
            {props.axisLabel}
        </Text>
    );

    // The value axis's ticks across violins on their sides: as many as fit, and the cutoff where it's clear of them.
    const tickValues = useMemo(() => {
        const baseTicks = horizonXScale.ticks(Math.max(2, Math.floor(horizonXMax / MIN_TICK_SPACING)));
        const clear = baseTicks.every((tick) => Math.abs(horizonXScale(tick) - horizonXScale(cutoffValue)) >= MIN_TICK_SPACING / 2);
        if (props.cutoffValue && clear) return Array.from(new Set([...baseTicks, cutoffValue])).sort((a, b) => a - b);
        return baseTicks;
    }, [horizonXScale, horizonXMax, cutoffValue, props.cutoffValue]);

    const valueAxisTop = (
        <AxisTop
            scale={horizonXScale}
            left={offset}
            stroke="black"
            tickStroke="black"
            tickValues={tickValues}
            // An object rather than a function, so it's merged over AxisTop's own, which lift the labels off the ticks.
            tickLabelProps={{
                fill: 'black',
                fontSize: fontSize,
                textAnchor: 'middle',
            }}
        />
    );

    //Download the plot as svg or png using the passed ref from the parent
    useImperativeHandle(props.ref, () => ({
        downloadSVG: () => {
            if (svgRef.current) downloadAsSVG(svgRef.current, props.downloadFileName ?? "violin_plot.svg");
        },
        downloadPNG: () => {
            if (svgRef.current) downloadSVGAsPNG(svgRef.current, props.downloadFileName ?? "violin_plot.png");
        },
    }));

    return (
        <div style={containerStyle}>
          {/* Violins on their sides scroll here, under the value axis. */}
          <PinnedAxisScroller
            scrollerRef={parentRef}
            scroller={node}
            pinned={horizontal}
            width={parentWidth}
            axisHeight={TOP_AXIS_SPACE}
            axis={
              <Group top={TOP_AXIS_SPACE} left={offset}>
                {valueAxisTop}
                {axisLabel}
              </Group>
            }
          >
            <svg
                width={parentWidth ?? 0}
                height={horizontal ? TOP_AXIS_SPACE + horizonYMax + BOTTOM_SPACE : parentHeight ?? 0}
                ref={svgRef}
                style={{ display: "block" }}
            >
                <Group top={horizontal ? TOP_AXIS_SPACE : baseOffset} left={offset}>
                    {props.distributions.map((x: Distribution<T>, i) => {
                        const Wrapper = props.animation ? motion.g : "g";
                        const animProps = getAnimationProps(props.animation, i, props.animationBuffer ?? .03);
                        
                        return (
                            <Wrapper key={`node-${i}`} {...animProps}>
                                <SingleViolin
                                    key={i}
                                    distribution={x}
                                    distIndex={i}
                                    violinProps={props.violinProps}
                                    crossProps={props.crossProps}
                                    valueScale={valueScale}
                                    labelScale={labelScale}
                                    offset={offset}
                                    labels={labels}
                                    disableCrossPlot={props.disableCrossPlot ?? false}
                                    disableViolinPlot={props.disableViolinPlot ?? false}
                                    horizontal={horizontal}
                                    pointTooltipBody={props.pointTooltipBody}
                                    onViolinClicked={props.onViolinClicked}
                                    onPointClicked={props.onPointClicked}
                                    tap={tap}
                                    tooltipRef={tooltipRef}
                                />
                            </Wrapper>
                        )
                    })}
                    {/* opacity box to cutoff the rest of the plot */}
                    {props.cutoffValue && (
                        horizontal ? (
                            <>
                                <rect
                                    x={offset}
                                    y={0}
                                    width={horizonXScale(cutoffValue)}
                                    height={horizonYMax}
                                    fill="white"
                                    opacity={props.cutoffOpacity ?? .8}
                                />
                                <rect
                                    x={-offset}
                                    y={0}
                                    width={2 * offset}
                                    height={horizonYMax}
                                    fill="white"
                                />
                            </>
                        ) : (
                            <>
                                <rect
                                    x={offset}
                                    y={vertYScale(cutoffValue)}
                                    width={parentWidth - offset}
                                    height={vertYScale(cutoffValue)}
                                    fill="white"
                                    opacity={props.cutoffOpacity ?? .8}
                                />
                                <rect
                                    x={offset}
                                    y={vertYMax}
                                    width={parentWidth - offset}
                                    height={maxLabelHeight + 2 * offset}
                                    fill="white"
                                />
                            </>
                        )
                    )}
                    {horizontal ? (
                        <>
                            <g className="pinned-axis">
                                {valueAxisTop}
                                {axisLabel}
                            </g>
                            <AxisLeft
                                key={"axisBottom"}
                                left={offset}
                                scale={horizonYScale}
                                stroke="black"
                                tickStroke="black"
                                tickValues={labels}
                                tickLabelProps={() => ({
                                    fill: 'black',
                                    fontSize: fontSize,
                                })}
                                tickComponent={({ x, y, formattedValue, ...tickProps }) => {
                                    const handleClick = () => {
                                        if (!props.onViolinClicked) return;

                                        const distribution = props.distributions.find(d => d.label === formattedValue)!;
                                        props.onViolinClicked(distribution);
                                    };

                                    if (labelOrientation !== "horizontal") {
                                        return (
                                            <text
                                                {...tickProps}
                                                onClick={handleClick}
                                                cursor={props.onViolinClicked ? "pointer" : "text"}
                                                x={x}
                                                y={y}
                                                dx={labelOrientation === "vertical" ? 0 : "-0.25em"}
                                                dy={labelOrientation === "vertical" ? "0.50em" : labelOrientation === "leftDiagonal" ? "-0.25em" : "0.25em"}
                                                transform={
                                                    labelOrientation === "vertical" ? `rotate(90, ${x}, ${y})` :
                                                        labelOrientation === "leftDiagonal" ? `rotate(-45, ${x}, ${y})` :
                                                            `rotate(45, ${x}, ${y})`
                                                }
                                                textAnchor={labelOrientation === "vertical" ? "middle" : "end"}
                                                dominantBaseline="middle"
                                            >
                                                {formattedValue}
                                            </text>
                                        );
                                    }
                                    return (
                                        <text {...tickProps} x={x} y={y} textAnchor="end" dominantBaseline="middle" dx="-0.50em" onClick={handleClick} cursor={props.onViolinClicked ? "pointer" : "text"}>
                                            {formattedValue}
                                        </text>
                                    );
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <AxisLeft
                                key={"axisLeft"}
                                left={offset}
                                scale={vertYScale}
                                stroke="black"
                                tickStroke="black"
                                tickLabelProps={() => ({
                                    fill: 'black',
                                    fontSize: fontSize,
                                    textAnchor: 'end',
                                    dy: '0.33em',
                                })}
                            />
                            {axisLabel}
                            <AxisBottom
                                key={"axisBottom"}
                                left={offset}
                                top={vertYMax}
                                scale={vertXScale}
                                stroke="black"
                                tickStroke="black"
                                tickValues={labels}
                                tickLabelProps={() => ({
                                    fill: 'black',
                                    fontSize: fontSize,
                                    textAnchor: labelOrientation === "vertical" || labelOrientation === "leftDiagonal" ? "end" : labelOrientation === "rightDiagonal" ? "start" : "middle",
                                })}
                                tickComponent={({ x, y, formattedValue, ...tickProps }) => {
                                    const handleClick = () => {
                                        if (!props.onViolinClicked) return;

                                        const distribution = props.distributions.find(d => d.label === formattedValue)!;
                                        props.onViolinClicked(distribution);
                                    };

                                    if (labelOrientation !== "horizontal") {
                                        return (
                                            <text
                                                onClick={handleClick}
                                                cursor={props.onViolinClicked ? "pointer" : "text"}
                                                {...tickProps}
                                                x={x}
                                                y={y}
                                                transform={
                                                    labelOrientation === "vertical" ? `rotate(-90, ${x}, ${y})` :
                                                        labelOrientation === "leftDiagonal" ? `rotate(-45, ${x}, ${y})` :
                                                            `rotate(45, ${x}, ${y})`
                                                }
                                                textAnchor={labelOrientation === "vertical" || labelOrientation === "leftDiagonal" ? "end" : labelOrientation === "rightDiagonal" ? "start" : "middle"}
                                            >
                                                {formattedValue}
                                            </text>
                                        );
                                    }
                                    return (
                                        <text {...tickProps} x={x} y={y} textAnchor="middle" onClick={handleClick} cursor={props.onViolinClicked ? "pointer" : "text"}>
                                            {formattedValue}
                                        </text>
                                    );
                                }}
                            />
                        </>
                    )
                    }
                    {props.show95thPercentileLine && (
                        horizontal ? (
                            horizonXScale.domain()[1] > 1.645 && (
                                <line
                                    x1={offset + horizonXScale(1.645)}
                                    x2={offset + horizonXScale(1.645)}
                                    y1={0}
                                    y2={horizonYMax}
                                    stroke="black"
                                    strokeDasharray="5 7"
                                />
                            )
                        ) : (
                            vertYScale.domain()[1] > 1.645 && (
                                <line
                                    y1={vertYScale(1.645)}
                                    y2={vertYScale(1.645)}
                                    x1={offset}
                                    x2={parentWidth}
                                    stroke="black"
                                    strokeDasharray="5 7"
                                />
                            )
                        )
                    )}
                    {/* cutoff dotted line */}
                    {props.cutoffValue && cutoffLine !== "none" && (
                        horizontal ? (
                            <line
                                x1={offset + horizonXScale(props.cutoffValue)}
                                x2={offset + horizonXScale(props.cutoffValue)}
                                y1={0}
                                y2={horizonYMax}
                                stroke="black"
                                strokeDasharray={cutoffLine === "dashed" ? "5 7" : ""}
                            />
                        ) : (
                            <line
                                y1={vertYScale(props.cutoffValue)}
                                y2={vertYScale(props.cutoffValue)}
                                x1={offset}
                                x2={parentWidth}
                                stroke="black"
                                strokeDasharray={cutoffLine === "dashed" ? "5 7" : ""}
                            />
                        )
                    )}
                </Group>
            </svg>
          </PinnedAxisScroller>
          {/* Matches the MUI tooltip layer, as the other plots' do. */}
          <PlotTooltip ref={tooltipRef} zIndex={theme.zIndex.tooltip}>
            {(data) => <ViolinTooltip data={data} pointTooltipBody={props.pointTooltipBody} />}
          </PlotTooltip>
        </div>
    );
}

export default ViolinPlot
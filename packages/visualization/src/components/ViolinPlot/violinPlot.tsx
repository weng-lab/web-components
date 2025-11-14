import { Distribution, ViolinPlotProps } from "./types";
import { useParentSize } from '@visx/responsive';
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AxisLeft, AxisBottom } from '@visx/axis';
import { useImperativeHandle, useMemo, useRef } from "react";
import { Text } from '@visx/text';
import { getTextHeight } from "./helpers";
import SingleViolin from "./singleViolin";
import { downloadAsSVG, downloadSVGAsPNG } from "../../utility";

const ViolinPlot = <T extends object>(
    props: ViolinPlotProps<T>,
) => {
    const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();
    const svgRef = useRef<SVGSVGElement | null>(null);

    //Array of labels fo xDomain
    const labels = useMemo(() => {
        return props.distributions.map((x, i) => x.label ?? `Group ${i + 1}`);
    }, [props.distributions]);

    const labelOrientation = props.labelOrientation ?? "horizontal"
    const fontSize = 15;

    //If the label orientation is anything but horizontal, find the max height of the elements, otherwise set to fontsize
    const maxLabelHeight = props.horizontal ? ((labelOrientation === "vertical" ? fontSize : Math.max(
        ...labels.map(label => getTextHeight(label, fontSize, "Arial"))
    ) / (labelOrientation !== "horizontal" ? 1.25 : 1))) :
        (labelOrientation === "horizontal" ? fontSize : Math.max(
            ...labels.map(label => getTextHeight(label, fontSize, "Arial"))
        ) / (labelOrientation !== "vertical" ? 1.25 : 1));

    const baseOffset = 40;
    const offset = props.horizontal ? labelOrientation !== "vertical" ? maxLabelHeight / 1.75 : maxLabelHeight : baseOffset;

    // bounds
    const vertXMax = parentWidth - 2 * offset;
    const vertYMax = parentHeight - maxLabelHeight - 2 * offset;
    const horizonXMax = parentWidth - 2.5 * offset;
    const horizonYMax = parentHeight - 130;

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
    }, [vertYMax, minYValue, maxYValue]);

    const horizonXScale = useMemo(() => {
        const padding = .07 * (maxYValue - (Math.max(minYValue, cutoffValue)))
        return scaleLinear<number>({
            range: [0, horizonXMax],
            round: true,
            // Make the bottom most tick 7% of the domain less so that there is room between the lowest plot and the bottom axis
            domain: [(Math.max(minYValue, cutoffValue)) - padding, maxYValue + padding],
        });
    }, [horizonXMax, minYValue, maxYValue]);

    const horizonYScale = useMemo(() => {
        return scaleBand<string>({
            range: [0, horizonYMax],
            round: true,
            domain: labels,
            padding: 0.4,
        });
    }, [horizonYMax, labels]);


    const valueScale = props.horizontal ? horizonXScale : vertYScale;
    const labelScale = props.horizontal ? horizonYScale : vertXScale;

    const axisLabel = props.horizontal ? (
        <Text
            textAnchor="middle"
            verticalAnchor="end"
            fontSize={fontSize}
            y={horizonYMax + baseOffset + 20}
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

    const tickValues = useMemo(() => {
        const baseTicks = vertYScale.ticks();
        if (props.cutoffValue) return Array.from(new Set([...baseTicks, cutoffValue])).sort((a, b) => a - b);
        return baseTicks;
    }, [vertYScale, cutoffValue]);

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
        <div style={{ position: "relative", width: "100%", height: "100%" }} ref={parentRef}>
            <svg width={parentWidth ?? 0} height={parentHeight?? 0} ref={svgRef}>
                <Group top={baseOffset} left={offset}>
                    {props.distributions.map((x: Distribution<T>, i) => {
                        return (
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
                                horizontal={props.horizontal ?? false}
                                pointTooltipBody={props.pointTooltipBody}
                                onViolinClicked={props.onViolinClicked}
                                onPointClicked={props.onPointClicked}
                            />
                        )
                    })}
                    {/* opacity box to cutoff the rest of the plot */}
                    {props.cutoffValue && (
                        props.horizontal ? (
                            <>
                                <rect
                                    x={0}
                                    y={0}
                                    width={horizonXScale(cutoffValue)}
                                    height={horizonYMax}
                                    fill="white"
                                    opacity={props.cutoffOpacity ?? .8}
                                />
                                <rect
                                    x={-maxLabelHeight}
                                    y={0}
                                    width={maxLabelHeight + offset}
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
                    {props.horizontal ? (
                        <>
                            <AxisBottom
                                key={"axisLeft"}
                                scale={horizonXScale}
                                top={horizonYMax}
                                left={offset}
                                stroke="black"
                                tickStroke="black"
                                tickValues={tickValues}
                                tickLabelProps={() => ({
                                    fill: 'black',
                                    fontSize: fontSize,
                                    textAnchor: 'end',
                                    dy: '0.33em',
                                })}
                            />
                            {axisLabel}
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
                    {/* cutoff dotted line */}
                    {props.cutoffValue && (
                        props.horizontal ? (
                            <line
                                x1={horizonXScale(props.cutoffValue)}
                                x2={horizonXScale(props.cutoffValue)}
                                y1={0}
                                y2={horizonYMax}
                                stroke="black"
                                strokeDasharray="5 7"
                            />
                        ) : (
                            <line
                                y1={vertYScale(props.cutoffValue)}
                                y2={vertYScale(props.cutoffValue)}
                                x1={offset}
                                x2={parentWidth}
                                stroke="black"
                                strokeDasharray="5 7"
                            />
                        )
                    )}
                </Group>
            </svg>
        </div>
    );
}

export default ViolinPlot
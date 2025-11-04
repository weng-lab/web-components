import { HeatmapRect, HeatmapCircle } from '@visx/heatmap';
import { scaleLinear } from '@visx/scale';
import { HeatmapProps, BinDatums, ColumnDatum } from "./types";
import { useParentSize } from "@visx/responsive";
import { useState, useImperativeHandle, useRef, ReactNode, useCallback } from 'react';
import { downloadAsSVG, downloadSVGAsPNG } from "../../utility";
import { AxisLeft, AxisBottom } from '@visx/axis';
import { Portal, TooltipWithBounds, useTooltip } from "@visx/tooltip";

const Heatmap = (props: HeatmapProps) => {
    const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();
    const [hoveredCell, setHoveredCell] = useState<{ row: number; column: number } | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    const handleClick = (row: number, column: number, count: string) => {
        if (!props.onClick) return;
        props.onClick(row, column, count);
    };

    const {
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
        showTooltip,
        hideTooltip,
    } = useTooltip<ReactNode>();

    const handleMouseMove = (row: number, column: number, count: string) => useCallback(
        (event: React.MouseEvent<SVGElement>) => {
            if (!props.tooltipBody) return;

            const tooltipContent = props.tooltipBody(row, column, count);
            
            showTooltip({
                tooltipLeft: event.clientX + 10,
                tooltipTop: event.clientY + 10,
                tooltipData: tooltipContent,
            });
        },
        [props.tooltipBody, props.data, showTooltip]
    );

    function max<Datum>(data: Datum[], value: (d: Datum) => number): number {
        return Math.max(...data.map(value));
    }
    function min<Datum>(data: Datum[], value: (d: Datum) => number): number {
        return Math.min(...data.map(value));
    }

    // accessors
    const rows = (d: ColumnDatum) => d.rows;
    const count = (d: BinDatums) => d.count;
    
    const allColNames: string[] = props.data.reduce((acc: string[], curr: ColumnDatum) => {
        acc.push(curr.columnName);
        return acc;
    }, []);
    const allRowNames: string[] = props.data[0].rows.reduce((acc: string[], curr: BinDatums) => {
        acc.push(curr.rowName);
        return acc;
    }, []);

    const colorMax = max(props.data, (d) => max(rows(d), count));
    const bucketSizeMax = max(props.data, (d) => rows(d).length); 

    const xScale = scaleLinear<number>({
        domain: [0, props.data.length],
    });

    const yScale = scaleLinear<number>({
        domain: [0, bucketSizeMax],
    });

    const colorScale = scaleLinear<string>({
        range: [props.color1, props.color2],
        domain: [0, colorMax],
    });

    const opacityScale = scaleLinear<number>({
        range: [0.1, 1],
        domain: [0.5, colorMax],
    });

    const maxColNameLength = allColNames.reduce((max, name) => Math.max(max, name.length), 0);
    const maxRowNameLength = allRowNames.reduce((max, name) => Math.max(max, name.length), 0);

    // bounds for display
    // the constants for the left and bottom margins really only work for font size of 12 to fit the axis labels in the svg....so maybe need to think of a more dynamic solution
    const defaultMargin = { top: 20, left: maxRowNameLength * 8 + 40, right: 10, bottom: maxColNameLength * 8 + 70};
    const defaultGap = 2;
    const margin = props.margin ?? defaultMargin;
    const gap = props.gap ?? defaultGap;
    
    const xMax = parentWidth > margin.left + margin.right ? parentWidth - margin.left - margin.right : parentWidth;
    const yMax = parentHeight - margin.bottom - margin.top;

    const binWidth = xMax / props.data.length;
    const binHeight = yMax / bucketSizeMax;
    const radius = min([binWidth, binHeight], (d) => d) / 2;

    xScale.range([0, xMax]);
    yScale.range([yMax, 0]);

    const xTickValues = props.data.map((_, i) => i + 0.5);
    const yTickValues = props.data[0].rows.map((_, i) => i + 0.5);

    // downloading plot
    useImperativeHandle(props.ref, () => ({
        downloadSVG: () => {
            if (svgRef.current) downloadAsSVG(svgRef.current, props.downloadFileName ?? "heatmap.svg");
        },
        downloadPNG: () => {
            if (svgRef.current) downloadSVGAsPNG(svgRef.current, props.downloadFileName ?? "heatmap.png");
        },
    }));

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }} ref={parentRef}>
            <svg width={parentWidth} height={parentHeight}>
                <g transform={`translate(${margin.left},${margin.top})`}>
                    {props.isRect ? (
                        <HeatmapRect
                                data={props.data}
                                xScale={(d) => xScale(d) ?? 0}
                                yScale={(d) => yScale(d) ?? 0}
                                colorScale={colorScale}
                                opacityScale={opacityScale}
                                binWidth={binWidth}
                                binHeight={binHeight}
                                bins={rows}
                                gap={gap}
                            >
                            {(heatmap) =>
                                heatmap.map((heatmapBins) =>
                                heatmapBins.map((bin) => (
                                    <g 
                                        onMouseEnter={() => {
                                            props.onHover(true);
                                            setHoveredCell({ row: bin.row, column: bin.column })
                                        }}
                                        onMouseLeave={() => {
                                            props.onHover(false);
                                            setHoveredCell(null);
                                            hideTooltip?.();
                                        }}
                                        onMouseMove={handleMouseMove(bin.row, bin.column,  bin.bin.count.toString())}
                                        onClick={() => handleClick(bin.row, bin.column, bin.bin.count.toString())}
                                        style={{ cursor: "pointer", transition: "stroke-width 0.2s" }}
                                    >
                                        <rect
                                            key={`heatmap-rect-${bin.row}-${bin.column}`}
                                            className="visx-heatmap-rect"
                                            width={bin.width}
                                            height={bin.height}
                                            x={bin.x}
                                            y={bin.y}
                                            fill={bin.color}
                                            fillOpacity={bin.opacity}
                                            stroke={hoveredCell?.row === bin.row && hoveredCell?.column === bin.column ? bin.color : "none"}
                                            strokeWidth={hoveredCell?.row === bin.row && hoveredCell?.column === bin.column ? 2 : 0}
                                            style={{ cursor: "pointer" }}
                                        />
                                    </g>
                                )))}
                            </HeatmapRect>
                            ) : (
                                <HeatmapCircle
                                    data={props.data}
                                    xScale={(d) => xScale(d) ?? 0}
                                    yScale={(d) => yScale(d) ?? 0}
                                    colorScale={colorScale}
                                    opacityScale={opacityScale}
                                    radius={radius}
                                    bins={rows}
                                    gap={gap}
                                >
                                {(heatmap) =>
                                    heatmap.map((heatmapBins) =>
                                    heatmapBins.map((bin) => (
                                        <g 
                                            onMouseEnter={() => props.onHover(true)}
                                            onMouseLeave={() => {
                                                props.onHover(false);
                                                hideTooltip?.();
                                            }}
                                            onMouseMove={handleMouseMove(bin.row, bin.column,  bin.bin.count.toString())}
                                            onClick={() => handleClick(bin.row, bin.column,  bin.bin.count.toString())}
                                            style={{ cursor: "pointer", transition: "stroke-width 0.2s" }}
                                        >
                                            <circle
                                                key={`heatmap-circle-${bin.row}-${bin.column}`}
                                                className="visx-heatmap-circle"
                                                cx={bin.cx}
                                                cy={bin.cy}
                                                r={bin.r}
                                                fill={bin.color}
                                                fillOpacity={bin.opacity}
                                                onClick={ () => handleClick(bin.row, bin.column, JSON.stringify(bin.bin)) }
                                                stroke={hoveredCell?.row === bin.row && hoveredCell?.column === bin.column ? bin.color : "none"}
                                                strokeWidth={hoveredCell?.row === bin.row && hoveredCell?.column === bin.column ? 2 : 0}
                                                style={{ cursor: "pointer" }}
                                            />
                                        </g>
                                    ))
                                    )
                                }
                                </HeatmapCircle>
                            )}
                        <AxisBottom
                            top={yMax + binHeight} 
                            scale={xScale}
                            numTicks={props.data.length}
                            tickFormat={(d) => allColNames[Math.floor(+d)] ?? ""}
                            tickValues={xTickValues}
                            stroke="#4d4f52"
                            tickStroke="#4d4f52"
                            tickLabelProps={() => ({
                                fontSize: 12,
                                fill: "#4d4f52",
                                fontFamily: 'sans-serif',
                                textAnchor: "end",
                                angle: -90,
                                dy: "0.25em",
                            })}
                            label={props.xLabel ?? ""}
                            labelOffset={maxColNameLength * 8}
                            labelProps={{
                                fontSize: 14,
                                fontFamily: 'sans-serif',
                                textAnchor: 'middle',
                                dy: '-0.5em',
                            }}
                        />
                        <AxisLeft
                            top={binHeight}
                            scale={yScale}
                            numTicks={bucketSizeMax}
                            tickValues={yTickValues}
                            tickFormat={(d) => allRowNames[Math.floor(+d)] ?? ""}
                            stroke="#4d4f52"
                            tickStroke="#4d4f52"
                            tickLabelProps={() => ({
                                fontSize: 12,
                                fill: "#4d4f52",
                                fontFamily: 'sans-serif',
                                textAnchor: "end",
                                dx: "-0.25em",
                                dy: "0.25em",
                            })}
                            label={props.yLabel ?? ""}
                            labelOffset={maxRowNameLength * 8}
                            labelProps={{
                                fontSize: 14,
                                fontFamily: 'sans-serif',
                                textAnchor: 'middle',
                            }}
                        />
                    </g>
                    {props.tooltipBody && tooltipOpen && tooltipData && (
                        <Portal>
                            <TooltipWithBounds left={(tooltipLeft ?? 0) + 10} top={tooltipTop}>
                                {tooltipData}
                            </TooltipWithBounds>
                        </Portal>
                    )}
                </svg>
            </div>
        );
}

export default Heatmap;
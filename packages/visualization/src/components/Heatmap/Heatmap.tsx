import { HeatmapRect, HeatmapCircle } from '@visx/heatmap';
import { scaleLinear } from '@visx/scale';
import { HeatmapProps, BinDatums, ColumnDatum } from "./types";
import { useParentSize } from "@visx/responsive";
import { useState, useImperativeHandle, useRef, ReactNode, useCallback } from 'react';
import { downloadAsSVG, downloadSVGAsPNG } from "../../utility";
import { AxisLeft, AxisBottom } from '@visx/axis';
import { Portal, TooltipWithBounds, useTooltip } from "@visx/tooltip";

const Heatmap = <T extends object>({
    data,
    onClick,
    ref,
    downloadFileName,
    color1,
    color2,
    color3,
    xLabel,
    yLabel,
    tooltipBody,
    margin,
    gap = 2,
    isRect = true,
}: HeatmapProps<T>) => {
    const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();
    const [hoveredCell, setHoveredCell] = useState<{ row: number; column: number } | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    const handleClick = (row: number, column: number, count: string) => {
        if (!onClick) return;
        onClick(row, column, count);
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
            if (!tooltipBody) return;

            const tooltipContent = tooltipBody(row, column, count);
            
            showTooltip({
                tooltipLeft: event.pageX + 10,
                tooltipTop: event.pageY + 10,
                tooltipData: tooltipContent,
            });
        },
        [tooltipBody, data, showTooltip]
    );

    type RenderShapeFn = (bin: any, centerX?: number) => React.ReactNode;
    const renderCell = (bin: any, renderShape: RenderShapeFn) => {
        const key = `heatmap-group-${bin.row}-${bin.column}`;
        return (
            <g
                key={key}
                onMouseEnter={() => setHoveredCell({ row: bin.row, column: bin.column })}
                onMouseLeave={() => {
                    setHoveredCell(null);
                    hideTooltip?.();
                }}
                onMouseMove={handleMouseMove(bin.row, bin.column, bin.bin.count.toString())}
                onClick={() => handleClick(bin.row, bin.column, bin.bin.count.toString())}
                style={{ cursor: "pointer", transition: "stroke-width 0.2s" }}
            >
                { renderShape(bin, bin.column * binWidth + binWidth / 2) }
            </g>
        );
    };

    function max<Datum>(data: Datum[], value: (d: Datum) => number): number {
        return Math.max(...data.map(value));
    }
    function min<Datum>(data: Datum[], value: (d: Datum) => number): number {
        return Math.min(...data.map(value));
    }

    // accessors
    const rows = (d: ColumnDatum<T>) => d.rows;
    const count = (d: BinDatums<T>) => d.count;
    
    const allColNames: string[] = data.reduce((acc: string[], curr: ColumnDatum<T>) => {
        acc.push(curr.columnName);
        return acc;
    }, []);
    const allRowNames: string[] = data[0].rows.reduce((acc: string[], curr: BinDatums<T>) => {
        acc.push(curr.rowName);
        return acc;
    }, []);

    const colorMax = max(data, (d) => max(rows(d), count));
    const bucketSizeMax = max(data, (d) => rows(d).length); 

    const xScale = scaleLinear<number>({
        domain: [0, data.length],
    });

    const yScale = scaleLinear<number>({
        domain: [0, bucketSizeMax],
    });

    const colorScale = scaleLinear<string>({
        range: [color1, color2, color3],
        domain: [0, colorMax / 2, colorMax],
    });

    const opacityScale = scaleLinear<number>({
        range: [0.5, 1],
        domain: [0.5, colorMax],
    });

    const maxColNameLength = allColNames.reduce((max, name) => Math.max(max, name.length), 0);
    const maxRowNameLength = allRowNames.reduce((max, name) => Math.max(max, name.length), 0);

    // bounds for display
    // the constants for the left and bottom margins really only work for font size of 12 to fit the axis labels in the svg....so maybe need to think of a more dynamic solution
    const marg = margin ?? { top: 20, left: maxRowNameLength * 8 + 40, right: 10, bottom: maxColNameLength * 8 + 70};
    
    const xMax = parentWidth > marg.left + marg.right ? parentWidth - marg.left - marg.right : parentWidth;
    const yMax = parentHeight - marg.bottom - marg.top;

    const binWidth = xMax / data.length;
    const binHeight = yMax / bucketSizeMax;
    const radius = min([binWidth, binHeight], (d) => d) / 2;

    xScale.range([0, xMax]);
    yScale.range([yMax, 0]);

    const xTickValues = data.map((_, i) => i + 0.5);
    const yTickValues = data[0].rows.map((_, i) => i + 0.5);

    // downloading plot
    useImperativeHandle(ref, () => ({
        downloadSVG: () => {
            if (svgRef.current) downloadAsSVG(svgRef.current, downloadFileName ?? "heatmap.svg");
        },
        downloadPNG: () => {
            if (svgRef.current) downloadSVGAsPNG(svgRef.current, downloadFileName ?? "heatmap.png");
        },
    }));

    const commonHeatmapProps = {
        data,
        xScale: (d: number) => xScale(d),
        yScale: (d: number) => yScale(d),
        colorScale,
        opacityScale,
        bins: rows,
        gap,
    };

    const HeatmapComponent = isRect ? HeatmapRect : HeatmapCircle;

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }} ref={parentRef}>
            <svg width={parentWidth} height={parentHeight}>
                <g transform={`translate(${marg.left},${marg.top})`}>
                    <HeatmapComponent
                        {...commonHeatmapProps}
                        {...(isRect
                            ? { binWidth, binHeight }
                            : { radius }
                        )}
                    >
                        {(heatmap) =>
                            heatmap.map((heatmapBins) =>
                            heatmapBins.map((bin) =>
                                renderCell(bin, (b, centerX?) =>
                                isRect ? (
                                    <rect
                                        className="visx-heatmap-rect"
                                        width={b.width}
                                        height={b.height}
                                        x={b.x}
                                        y={b.y}
                                        fill={b.color}
                                        fillOpacity={b.opacity}
                                        stroke={hoveredCell?.row === b.row && hoveredCell?.column === b.column ? b.color : "none"}
                                        strokeWidth={hoveredCell?.row === b.row && hoveredCell?.column === b.column ? 2 : 0}
                                        style={{ cursor: "pointer" }}
                                    />
                                ) : (
                                    <circle
                                        className="visx-heatmap-circle"
                                        cx={centerX}
                                        cy={b.cy}
                                        r={b.r}
                                        fill={b.color}
                                        fillOpacity={b.opacity}
                                        stroke={hoveredCell?.row === b.row && hoveredCell?.column === b.column ? b.color : "none"}
                                        strokeWidth={hoveredCell?.row === b.row && hoveredCell?.column === b.column ? 2 : 0}
                                        style={{ cursor: "pointer" }}
                                    />
                                )
                                )
                            )
                            )
                        }
                        </HeatmapComponent>
                        <AxisBottom
                            top={yMax + binHeight} 
                            scale={xScale}
                            numTicks={data.length}
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
                            label={xLabel ?? ""}
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
                            label={yLabel ?? ""}
                            labelOffset={maxRowNameLength * 8}
                            labelProps={{
                                fontSize: 14,
                                fontFamily: 'sans-serif',
                                textAnchor: 'middle',
                            }}
                        />
                    </g>
                    {tooltipBody && tooltipOpen && tooltipData && (
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
import { HeatmapRect, HeatmapCircle } from '@visx/heatmap';
import { scaleLinear } from '@visx/scale';
import { HeatmapProps, BinDatums, ColumnDatum } from "./types";
import { useParentSize } from "@visx/responsive";
import { bin } from '@visx/vendor/d3-array';

const Heatmap = (props: HeatmapProps) => {
    const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();

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

    // bounds for display
    const defaultMargin = { top: 20, left: 10, right: 0, bottom: 10 };
    const defaultGap = 3;
    const margin = props.margin ?? defaultMargin;
    const gap = props.gap ?? defaultGap;
    
    const xMax = parentWidth > margin.left + margin.right ? parentWidth - margin.left - margin.right : parentWidth;;
    const yMax = parentHeight - margin.bottom - margin.top;
    
    const binWidth = parentWidth / props.data.length;
    const binHeight = parentHeight / bucketSizeMax;
    const radius = min([binWidth, binHeight], (d) => d) / 2;

    const maxColNameLength = allColNames.reduce((max, name) => Math.max(max, name.length), 0);
    const maxRowNameLength = allRowNames.reduce((max, name) => Math.max(max, name.length), 0);

    xScale.range([0, xMax]);
    yScale.range([yMax, 0]);
    
    return <div style={{ 
        display: "grid", 
        position: "relative", 
        gridTemplateAreas: `
            "heatmap rowLabels yLabel" 
            "colLabels empty empty" 
            "xLabel empty empty"
        `,
        width: "100%", 
        height: "100%" }} 
        ref={parentRef}>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
            <div style={{ gridArea: "heatmap", width: parentWidth + margin.left + margin.right, height: parentHeight + margin.top + margin.bottom}} ref={parentRef}>
                <svg width={parentWidth} height={parentHeight}>
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
                                <rect
                                key={`heatmap-rect-${bin.row}-${bin.column}`}
                                className="visx-heatmap-rect"
                                width={bin.width}
                                height={bin.height}
                                x={bin.x}
                                y={bin.y}
                                fill={bin.color}
                                fillOpacity={bin.opacity}
                                onClick={() =>
                                    props.onClick(bin.row, bin.column, JSON.stringify(bin.bin))
                                }
                                style={{ cursor: "pointer" }}
                                />
                            ))
                            )
                        }
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
                                <circle
                                key={`heatmap-circle-${bin.row}-${bin.column}`}
                                className="visx-heatmap-circle"
                                cx={bin.cx}
                                cy={bin.cy}
                                r={bin.r}
                                fill={bin.color}
                                fillOpacity={bin.opacity}
                                onClick={() =>
                                    props.onClick(bin.row, bin.column, JSON.stringify(bin.bin))
                                }
                                style={{ cursor: "pointer" }}
                                />
                            ))
                            )
                        }
                        </HeatmapCircle>
                    )}
                    </svg>
                </div>
                </g>
                <div style={{ gridArea: "rowLabels" }}>
                    <svg width={maxRowNameLength * 8 + 40} height={parentHeight}> 
                        {allRowNames.map((rowName, index) => (
                            <text
                                x={10}
                                y={yScale(index) + binHeight / 2}
                                fontSize={14}
                                fontFamily="Arial"
                                alignmentBaseline="middle"
                            >
                                {rowName}
                            </text>
                        ))}
                    </svg>
                </div>
                <div style={{
                    gridArea: "yLabel",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    fontSize: 20,
                    fontFamily: "Arial",
                    color: "black",
                    height: parentHeight,
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    textAlign: "center",
                }}>
                    {props.yLabel}
                </div>
                <div style={{ gridArea: "colLabels"}}>
                    <svg width={parentWidth} height={maxColNameLength * 8 + 40}>
                        {allColNames.map((colName, index) => ( 
                            <text 
                                key={`col-label-${colName}-${index}`} 
                                transform={`translate(${xScale(index) + binWidth / 2}) rotate(-90)`} 
                                fontSize={14} 
                                fontFamily="Arial"
                                textAnchor='end'
                            > 
                                {colName} 
                            </text>),) 
                        }
                    </svg>
                </div>
                <div style={{
                    gridArea: "xLabel",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontFamily: "Arial",
                    color: "black",
                    overflowWrap: "break-word", 
                    wordBreak: "break-word",
                    textAlign: "center",
                }}
                >
                    {props.xLabel}
                </div>
    </div>;
}

export default Heatmap;
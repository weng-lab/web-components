import React, { useEffect, useId, useRef } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import { Group } from "@visx/group";
import { AxisBottom, AxisLeft, AxisRight, AxisTop } from "@visx/axis";
import { LinePath } from "@visx/shape";
import { Text } from "@visx/text";
import { curveBasis } from "@visx/curve";
import { Portal } from "@visx/tooltip";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { HighlightAlt } from "@mui/icons-material";
import { motion } from "framer-motion";
import { BackgroundGradient, ChartProps, Lines, Point, SelectionMode, ZoomType } from "./types";
import { getTicks, getTrianglePoints } from "./helpers";
import { getAnimationProps } from "../../utility";
import ScatterTooltip from "./tooltip";
import MiniMap from "./minimap";

type PlotMargin = {
    top: number;
    left: number;
};

type ScatterPlotViewportProps<T extends object> = {
    size: number;
    margin: PlotMargin;
    boundedWidth: number;
    boundedHeight: number;
    loading: boolean;
    pointData: Point<T>[];
    showPointAnimation: boolean;
    animation?: ChartProps<T, boolean | undefined, boolean | undefined>["animation"];
    animationGroupSize?: number;
    animationBuffer?: number;
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
    xScaleTransformed: ScaleLinear<number, number, never>;
    yScaleTransformed: ScaleLinear<number, number, never>;
    displayedPoints: Point<T>[];
    onDisplayedPointsChange?: (points: Point<T>[]) => void;
    drawPoints: (xScaleTransformed: ScaleLinear<number, number, never>, yScaleTransformed: ScaleLinear<number, number, never>, canvas: HTMLCanvasElement) => void;
    divRef: React.RefObject<HTMLDivElement | null>;
    handleMouseMove: (event: React.MouseEvent<SVGElement>, zoom: ZoomType) => void;
    handleMouseLeave: () => void;
    zoom: ZoomType;
    selectMode: SelectionMode;
    lines: Lines;
    isDragging: boolean;
    x: number;
    y: number;
    dx: number;
    dy: number;
    graphRef: React.RefObject<SVGRectElement | null>;
    surfaceCursor: string;
    onSurfaceMouseDown?: React.MouseEventHandler<SVGRectElement>;
    onSurfaceMouseUp?: React.MouseEventHandler<SVGRectElement>;
    onSurfaceMouseMove?: React.MouseEventHandler<SVGRectElement>;
    onSurfaceMouseLeave?: React.MouseEventHandler<SVGRectElement>;
    onSurfaceTouchStart?: React.TouchEventHandler<SVGRectElement>;
    onSurfaceTouchEnd?: React.TouchEventHandler<SVGRectElement>;
    onSurfaceTouchMove?: React.TouchEventHandler<SVGRectElement>;
    onSurfaceWheel: React.WheelEventHandler<SVGRectElement>;
    onSurfaceClick: React.MouseEventHandler<SVGRectElement>;
    leftAxisLabel?: string;
    bottomAxisLabel?: string;
    miniMap?: ChartProps<T, boolean | undefined, boolean | undefined>["miniMap"];
    disableZoom?: boolean;
    showMiniMap: boolean;
    toggleMiniMap: () => void;
    controlsHighlight?: string;
    disableTooltip?: boolean;
    tooltipOpen: boolean;
    tooltipData: Point<T> | null;
    tooltipBody?: (point: Point<T>) => React.ReactElement;
    isHoveredPointWithinBounds: boolean;
    mouseX: number;
    mouseY: number;
    VisTooltip: React.FC<{ left?: number; top?: number; children?: React.ReactNode }>;
    border: boolean;
    originLine?: boolean;
    backgroundGradient?: BackgroundGradient;
};

const ScatterPlotViewport = <T extends object>({
    size,
    margin,
    boundedWidth,
    boundedHeight,
    loading,
    pointData,
    showPointAnimation,
    animation,
    animationGroupSize,
    animationBuffer,
    xScale,
    yScale,
    xScaleTransformed,
    yScaleTransformed,
    displayedPoints,
    onDisplayedPointsChange,
    drawPoints,
    divRef,
    handleMouseMove,
    handleMouseLeave,
    zoom,
    selectMode,
    lines,
    isDragging,
    x,
    y,
    dx,
    dy,
    graphRef,
    surfaceCursor,
    onSurfaceMouseDown,
    onSurfaceMouseUp,
    onSurfaceMouseMove,
    onSurfaceMouseLeave,
    onSurfaceTouchStart,
    onSurfaceTouchEnd,
    onSurfaceTouchMove,
    onSurfaceWheel,
    onSurfaceClick,
    leftAxisLabel,
    bottomAxisLabel,
    miniMap,
    disableZoom,
    showMiniMap,
    toggleMiniMap,
    controlsHighlight,
    disableTooltip,
    tooltipOpen,
    tooltipData,
    tooltipBody,
    isHoveredPointWithinBounds,
    mouseX,
    mouseY,
    VisTooltip,
    border,
    originLine,
    backgroundGradient,
}: ScatterPlotViewportProps<T>) => {
    const previousDisplayedPoints = useRef<Point<T>[]>([]);
    const colorbarGradId = `sg-${useId().replace(/:/g, "")}`;

    useEffect(() => {
        const haveDisplayedPointsChanged = (prevPoints: Point<T>[], nextPoints: Point<T>[]) => {
            if (prevPoints.length !== nextPoints.length) return true;
            return !prevPoints.every((point, index) => {
                const nextPoint = nextPoints[index];
                return (
                    point.x === nextPoint.x &&
                    point.y === nextPoint.y &&
                    point.r === nextPoint.r &&
                    point.shape === nextPoint.shape &&
                    point.color === nextPoint.color &&
                    point.opacity === nextPoint.opacity
                );
            });
        };

        if (haveDisplayedPointsChanged(previousDisplayedPoints.current, displayedPoints)) {
            onDisplayedPointsChange?.(displayedPoints);
            previousDisplayedPoints.current = displayedPoints;
        }
    }, [displayedPoints, onDisplayedPointsChange]);

    return (
        <>
            <Stack justifyContent="center" alignItems="center" direction="row" sx={{ position: "relative" }}>
                <Box sx={{ width: size, height: size }}>
                    {loading ? (
                        <Box display="flex" width="100%" height="100%" sx={{ justifyContent: "center", alignItems: "center" }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <div style={{ position: "relative" }} ref={divRef}>
                            {/* canvas for points */}
                            <canvas
                                ref={(canvas) => {
                                    if (canvas && !showPointAnimation) {
                                        drawPoints(xScaleTransformed, yScaleTransformed, canvas);
                                    }
                                }}
                                width={boundedWidth * 2}
                                height={boundedHeight * 2}
                                style={{
                                    userSelect: "none",
                                    position: "absolute",
                                    top: margin.top,
                                    left: margin.left,
                                    width: boundedWidth,
                                    height: boundedHeight,
                                    backgroundColor: "transparent",
                                }}
                            />
                            <svg
                                width={size}
                                height={size}
                                overflow="visible"
                                style={{ position: "absolute", userSelect: "none" }}
                                onMouseMove={(event) => handleMouseMove(event, zoom)}
                                onMouseLeave={handleMouseLeave}
                            >
                                {backgroundGradient?.legend && (
                                    <defs>
                                        <linearGradient id={colorbarGradId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={(backgroundGradient.colorScale ?? ["red", "white", "blue"])[2]} />
                                            <stop offset="50%" stopColor={(backgroundGradient.colorScale ?? ["red", "white", "blue"])[1]} />
                                            <stop offset="100%" stopColor={(backgroundGradient.colorScale ?? ["red", "white", "blue"])[0]} />
                                        </linearGradient>
                                    </defs>
                                )}
                                <Group top={margin.top} left={margin.left}>
                                    {showPointAnimation && animation && (
                                        <g>
                                            {pointData.map((point, index) => {
                                                const Wrapper = motion.g;
                                                const groupIndex = Math.floor(index / (animationGroupSize ?? 1));
                                                const animationProps = getAnimationProps(animation, groupIndex, animationBuffer ?? 0.03);
                                                const cx = xScaleTransformed(point.x);
                                                const cy = yScaleTransformed(point.y);
                                                if (cx < 0 || cx > boundedWidth || cy < 0 || cy > boundedHeight) return null;

                                                const radius = point.r ?? 3;

                                                return (
                                                    <Wrapper key={`pt-${index}`} {...animationProps}>
                                                        {point.shape === "triangle" ? (
                                                            <polygon
                                                                points={getTrianglePoints(cx, cy, radius)}
                                                                fill={point.color ?? "black"}
                                                                opacity={point.opacity ?? 1}
                                                            />
                                                        ) : (
                                                            <circle
                                                                cx={cx}
                                                                cy={cy}
                                                                r={radius}
                                                                fill={point.color ?? "black"}
                                                                opacity={point.opacity ?? 1}
                                                            />
                                                        )}
                                                    </Wrapper>
                                                );
                                            })}
                                        </g>
                                    )}
                                    {selectMode === "select" && (
                                        <>
                                            {lines.map((line, index) => (
                                                <LinePath
                                                    key={`line-${index}`}
                                                    fill="transparent"
                                                    stroke="black"
                                                    strokeWidth={3}
                                                    data={line}
                                                    curve={curveBasis}
                                                    x={(datum) => datum.x}
                                                    y={(datum) => datum.y}
                                                />
                                            ))}
                                            {isDragging && (
                                                <g>
                                                    <line
                                                        x1={x - margin.left + dx - 6}
                                                        y1={y - margin.top + dy}
                                                        x2={x - margin.left + dx + 6}
                                                        y2={y - margin.top + dy}
                                                        stroke="black"
                                                        strokeWidth={1}
                                                    />
                                                    <line
                                                        x1={x - margin.left + dx}
                                                        y1={y - margin.top + dy - 6}
                                                        x2={x - margin.left + dx}
                                                        y2={y - margin.top + dy + 6}
                                                        stroke="black"
                                                        strokeWidth={1}
                                                    />
                                                    <circle cx={x - margin.left} cy={y - margin.top} r={4} fill="transparent" stroke="black" pointerEvents="none" />
                                                </g>
                                            )}
                                        </>
                                    )}
                                    {/* dotted line @ 0,0 */}
                                    {originLine && (() => {
                                        const x0 = xScaleTransformed(0);
                                        const y0 = yScaleTransformed(0);
                                        return (
                                            <>
                                                {y0 >= 0 && y0 <= boundedHeight && (
                                                    <line x1={0} x2={boundedWidth} y1={y0} y2={y0} stroke="#000" strokeWidth={1} strokeDasharray="4,4" pointerEvents="none" />
                                                )}
                                                {x0 >= 0 && x0 <= boundedWidth && (
                                                    <line x1={x0} x2={x0} y1={0} y2={boundedHeight} stroke="#000" strokeWidth={1} strokeDasharray="4,4" pointerEvents="none" />
                                                )}
                                            </>
                                        );
                                    })()}
                                    {/* interactable surface */}
                                    <rect
                                        ref={graphRef}
                                        fill="transparent"
                                        width={boundedWidth}
                                        height={boundedHeight}
                                        style={{ cursor: surfaceCursor }}
                                        onMouseDown={onSurfaceMouseDown}
                                        onMouseUp={onSurfaceMouseUp}
                                        onMouseMove={onSurfaceMouseMove}
                                        onMouseLeave={onSurfaceMouseLeave}
                                        onTouchStart={onSurfaceTouchStart}
                                        onTouchEnd={onSurfaceTouchEnd}
                                        onTouchMove={onSurfaceTouchMove}
                                        onWheel={onSurfaceWheel}
                                        onClick={onSurfaceClick}
                                    />
                                </Group>
                                <Group top={margin.top} left={margin.left}>
                                    <AxisLeft
                                        scale={yScaleTransformed}
                                        tickLabelProps={() => ({
                                            fill: "#1c1917",
                                            fontSize: 10,
                                            textAnchor: "end",
                                            verticalAnchor: "middle",
                                            x: -10,
                                        })}
                                        tickValues={getTicks(yScaleTransformed, 5)}
                                    />
                                    <AxisBottom
                                        top={boundedHeight}
                                        scale={xScaleTransformed}
                                        tickLabelProps={() => ({
                                            fill: "#1c1917",
                                            fontSize: 11,
                                            textAnchor: "middle",
                                        })}
                                        tickValues={getTicks(xScaleTransformed, 5)}
                                    />
                                    {border && (
                                        <>
                                            <AxisTop
                                                top={0}
                                                scale={xScaleTransformed}
                                                tickValues={[]}
                                            />
                                            <AxisRight
                                                scale={yScaleTransformed}
                                                tickValues={[]}
                                                left={boundedWidth}
                                            />
                                        </>
                                    )}
                                    <Text textAnchor="middle" verticalAnchor="end" angle={-90} fontSize={15} y={boundedHeight / 2} x={0} dx={-50}>
                                        {leftAxisLabel}
                                    </Text>
                                    <Text textAnchor="middle" verticalAnchor="start" fontSize={15} y={boundedHeight} x={boundedWidth / 2} dy={50}>
                                        {bottomAxisLabel}
                                    </Text>
                                </Group>
                                {pointData.some(p => p.label) && (
                                    <Group top={margin.top} left={margin.left}>
                                        {pointData.map((point, i) => {
                                            if (!point.label) return null;
                                            const cx = xScaleTransformed(point.x);
                                            const cy = yScaleTransformed(point.y);
                                            if (cx < 0 || cx > boundedWidth || cy < 0 || cy > boundedHeight) return null;

                                            const lineLen = 20;
                                            const estTextWidth = point.label.length * 7;
                                            const circleR = (point.r ?? 3) + 3;
                                            const angle = Math.atan2(cy - boundedHeight / 2, cx - boundedWidth / 2);
                                            let cosA = Math.cos(angle);
                                            let sinA = Math.sin(angle);

                                            // Flip horizontal component if text would overflow left/right
                                            const lxRaw = cx + cosA * lineLen;
                                            const textEndX = cosA >= 0 ? lxRaw + 4 + estTextWidth : lxRaw - 4 - estTextWidth;
                                            if (textEndX > boundedWidth || textEndX < 0) cosA = -cosA;

                                            // Flip vertical component if line endpoint would overflow top/bottom
                                            const lyRaw = cy + sinA * lineLen;
                                            if (lyRaw < 0 || lyRaw > boundedHeight) sinA = -sinA;

                                            const lx = cx + cosA * lineLen;
                                            const ly = cy + sinA * lineLen;
                                            const anchor = cosA >= 0 ? "start" : "end";

                                            return (
                                                <g key={`lbl-${i}`} pointerEvents="none">
                                                    <line x1={cx + cosA * circleR} y1={cy + sinA * circleR} x2={lx} y2={ly} stroke="#555" strokeWidth={1} />
                                                    <text x={lx + (cosA >= 0 ? 4 : -4)} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fontWeight="bold" fill="#1c1917">
                                                        {point.label}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </Group>
                                )}
                                {backgroundGradient?.legend && (() => {
                                    const { label, minLabel, midLabel, maxLabel } = backgroundGradient.legend;
                                    const barLeft = margin.left + boundedWidth + 25;
                                    const barHeight = boundedHeight;
                                    return (
                                        <Group top={margin.top} left={barLeft}>
                                            <rect x={0} y={0} width={16} height={barHeight} fill={`url(#${colorbarGradId})`} stroke="#aaa" strokeWidth={0.5} />
                                            <line x1={16} x2={22} y1={0} y2={0} stroke="#555" strokeWidth={1} />
                                            <line x1={16} x2={22} y1={barHeight / 2} y2={barHeight / 2} stroke="#555" strokeWidth={1} />
                                            <line x1={16} x2={22} y1={barHeight} y2={barHeight} stroke="#555" strokeWidth={1} />
                                            {maxLabel && <text x={26} y={0} dy="0.35em" fontSize={10} fill="#1c1917">{maxLabel}</text>}
                                            <text x={26} y={barHeight / 2} dy="0.35em" fontSize={10} fill="#1c1917">{midLabel ?? "0"}</text>
                                            {minLabel && <text x={26} y={barHeight} dy="0.35em" fontSize={10} fill="#1c1917">{minLabel}</text>}
                                            {label && (
                                                <Text textAnchor="middle" verticalAnchor="end" angle={90} fontSize={14} y={barHeight / 2} x={0} dx={65}>
                                                    {label}
                                                </Text>
                                            )}
                                        </Group>
                                    );
                                })()}
                            </svg>
                        </div>
                    )}
                </Box>
            </Stack>
            {miniMap && !disableZoom && (
                <Tooltip title="Toggle Minimap">
                    <IconButton
                        sx={{
                            position: "absolute",
                            right: 10,
                            bottom: 10,
                            zIndex: 10,
                            width: "auto",
                            height: "auto",
                            color: showMiniMap ? controlsHighlight ?? "primary.main" : "default",
                        }}
                        size="small"
                        onClick={toggleMiniMap}
                    >
                        <HighlightAlt />
                    </IconButton>
                </Tooltip>
            )}
            {showMiniMap && miniMap && !disableZoom && !loading && (
                <MiniMap
                    miniMap={miniMap}
                    width={size}
                    height={size}
                    pointData={pointData}
                    xScale={xScale}
                    yScale={yScale}
                    zoom={zoom}
                />
            )}
            {!disableTooltip && tooltipOpen && tooltipData && isHoveredPointWithinBounds && (
                <Portal>
                    <VisTooltip left={mouseX + 10} top={mouseY}>
                        <ScatterTooltip tooltipBody={tooltipBody} tooltipData={tooltipData} />
                    </VisTooltip>
                </Portal>
            )}
        </>
    );
};

export default ScatterPlotViewport;

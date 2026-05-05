import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { Box, Stack } from "@mui/material";
import { Group } from "@visx/group";
import { AxisBottom, AxisLeft, AxisRight, AxisTop } from "@visx/axis";
import { LinePath } from "@visx/shape";
import { Text } from "@visx/text";
import { curveBasis } from "@visx/curve";
import { localPoint } from "@visx/event";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { BackgroundGradient, ChartProps, Point, SelectionMode, ZoomType } from "./types";
import { drawCanvasPoint, getTicks, isPointVisible, partitionPointsByHover, prepareCanvas, rescaleX, rescaleY } from "./helpers";
import AnimatedPoints from "./AnimatedPoints";
import PointLabels from "./PointLabels";
import GradientLegend from "./GradientLegend";
import { useDragSelection } from "./hooks/useDragSelection";

type ScatterPlotViewportProps<T extends object> = {
    size: number;
    margin: { top: number; left: number };
    boundedWidth: number;
    boundedHeight: number;
    loading: boolean;
    pointData: Point<T>[];
    animation?: ChartProps<T, boolean | undefined, boolean | undefined>["animation"];
    animationGroupSize?: number;
    animationBuffer?: number;
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
    zoom: ZoomType;
    selectMode: SelectionMode;
    selectable: boolean;
    disableZoom?: boolean;
    groupPointsAnchor?: keyof Point<T> | keyof T;
    hoveredPoint: Point<T> | null;
    handleMouseMove: (event: React.MouseEvent<SVGElement>, zoom: ZoomType) => void;
    handleMouseLeave: () => void;
    onDisplayedPointsChange?: (points: Point<T>[]) => void;
    onSelectionChange?: (selectedPoints: Point<T>[]) => void;
    onPointClicked?: (point: Point<T>) => void;
    leftAxisLabel?: string;
    bottomAxisLabel?: string;
    border: boolean;
    originLine?: boolean;
    backgroundGradient?: BackgroundGradient;
    divRef: React.RefObject<HTMLDivElement | null>;
};

const ScatterPlotViewport = <T extends object>({
    size,
    margin,
    boundedWidth,
    boundedHeight,
    loading,
    pointData,
    animation,
    animationGroupSize,
    animationBuffer,
    xScale,
    yScale,
    zoom,
    selectMode,
    selectable,
    disableZoom,
    groupPointsAnchor,
    hoveredPoint,
    handleMouseMove,
    handleMouseLeave,
    onDisplayedPointsChange,
    onSelectionChange,
    onPointClicked,
    leftAxisLabel,
    bottomAxisLabel,
    border,
    originLine,
    backgroundGradient,
    divRef,
}: ScatterPlotViewportProps<T>) => {
    const graphRef = useRef<SVGRectElement | null>(null);

    // Animation state — viewport owns what it renders
    const [showPointAnimation, setShowPointAnimation] = useState(Boolean(animation));

    useEffect(() => {
        if (!animation) return;
        if (pointData.length > 2500) {
            setShowPointAnimation(false);
            return;
        }
        const duration = 450;
        const buffer = (animationBuffer ?? 0.03) * 1000;
        const groups = Math.ceil(pointData.length / (animationGroupSize ?? 1));
        const total = duration + groups * buffer;

        const t = window.setTimeout(() => setShowPointAnimation(false), total);
        return () => window.clearTimeout(t);
    }, [animation, animationBuffer, animationGroupSize, pointData.length]);

    const { lines, isDragging, x, y, dx, dy, dragStart, dragMove, dragEnd, completeSelection } =
        useDragSelection({ pointData, margin, xScale, yScale, onSelectionChange });

    // Passive event listeners to prevent default scroll/touch behavior on the chart surface
    useEffect(() => {
        const graphElement = graphRef.current;

        const handleWheel = (event: WheelEvent) => { event.preventDefault(); };
        const handleTouchMove = (event: TouchEvent) => { event.preventDefault(); };
        const handleTouchStart = (event: TouchEvent) => { event.preventDefault(); };

        if (graphElement) {
            graphElement.addEventListener('wheel', handleWheel, { passive: false });
            graphElement.addEventListener('touchstart', handleTouchStart, { passive: false });
            graphElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        }

        return () => {
            if (graphElement) {
                graphElement.removeEventListener('wheel', handleWheel);
                graphElement.removeEventListener('touchstart', handleTouchStart);
                graphElement.removeEventListener('touchmove', handleTouchMove);
            }
        };
    }, [graphRef]);

    const xScaleTransformed = rescaleX(xScale, zoom.transformMatrix.translateX, zoom.transformMatrix.scaleX);
    const yScaleTransformed = rescaleY(yScale, zoom.transformMatrix.translateY, zoom.transformMatrix.scaleY);

    const groupedPoints: Point<T>[] = useMemo(() => {
        const anchor = groupPointsAnchor;
        if (anchor && hoveredPoint) {
            return pointData.filter((point) => {
                if (anchor in point) {
                    return point[anchor as keyof Point<T>] === hoveredPoint[anchor as keyof Point<T>];
                }
                if (point.metaData && hoveredPoint.metaData) {
                    return point.metaData[anchor as keyof T] === hoveredPoint.metaData[anchor as keyof T];
                }
                return false;
            });
        }
        return hoveredPoint ? [hoveredPoint] : [];
    }, [hoveredPoint, groupPointsAnchor, pointData]);

    const hoveredPointKeys = useMemo(
        () => new Set(groupedPoints.map((point) => `${point.x},${point.y}`)),
        [groupedPoints]
    );

    const currentDisplayedPoints = useMemo(
        () => pointData.filter((point) => {
            const tx = xScaleTransformed(point.x);
            const ty = yScaleTransformed(point.y);
            return tx >= 0 && tx <= boundedWidth && ty >= 0 && ty <= boundedHeight;
        }),
        // xScaleTransformed/yScaleTransformed are new objects each zoom change, so this correctly recomputes
        [pointData, zoom.transformMatrix, boundedWidth, boundedHeight]
    );

    const drawPoints = useCallback((
        xST: ScaleLinear<number, number, never>,
        yST: ScaleLinear<number, number, never>,
        canvas: HTMLCanvasElement
    ) => {
        const context = canvas.getContext('2d');
        if (!context) return;

        prepareCanvas(context, boundedWidth, boundedHeight);

        if (backgroundGradient) {
            const [colorLow, colorMid, colorHigh] = backgroundGradient.colorScale ?? ["red", "white", "blue"];
            const W = boundedWidth;
            const H = boundedHeight;
            const x0 = xST(0);
            const y0 = yST(0);
            const fraction = Math.max(0.001, Math.min(0.999, (x0 * W - y0 * H + H * H) / (W * W + H * H)));
            const gradient = context.createLinearGradient(0, H, W, 0);
            gradient.addColorStop(0, colorLow);
            gradient.addColorStop(fraction, colorMid);
            gradient.addColorStop(1, colorHigh);
            context.globalAlpha = backgroundGradient.opacity ?? 1;
            context.fillStyle = gradient;
            context.fillRect(0, 0, W, H);
            context.globalAlpha = 1;
        }

        const { nonHovered, hovered } = partitionPointsByHover(pointData, hoveredPointKeys);

        const drawRenderedPoint = (point: Point<T>, isHovered: boolean) => {
            const transformedX = xST(point.x);
            const transformedY = yST(point.y);
            if (!isPointVisible(transformedX, transformedY, boundedWidth, boundedHeight)) return;
            drawCanvasPoint(context, point, transformedX, transformedY, isHovered);
        };

        nonHovered.forEach((point) => drawRenderedPoint(point, false));
        hovered.forEach((point) => drawRenderedPoint(point, true));
    }, [boundedHeight, boundedWidth, hoveredPointKeys, pointData, backgroundGradient]);

    const handlePointClick = useCallback(() => {
        if (hoveredPoint) onPointClicked?.(hoveredPoint);
    }, [hoveredPoint, onPointClicked]);

    const surfaceCursor = disableZoom
        ? selectable
            ? isDragging ? 'none' : 'crosshair'
            : isDragging ? 'none' : 'default'
        : hoveredPoint
            ? 'default'
            : selectMode === 'select'
                ? isDragging ? 'none' : 'crosshair'
                : zoom.isDragging
                    ? 'grabbing'
                    : 'grab';

    const handleSelectionEnd = (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
        dragEnd(event);
        completeSelection(zoom);
    };

    const onSurfaceMouseDown = selectMode === "none"
        ? undefined
        : selectMode === "select"
            ? dragStart
            : disableZoom ? undefined : zoom.dragStart;
    const onSurfaceMouseUp = selectMode === "none"
        ? undefined
        : selectMode === "select"
            ? handleSelectionEnd
            : disableZoom ? undefined : zoom.dragEnd;
    const onSurfaceMouseMove = selectMode === "none"
        ? undefined
        : selectMode === "select"
            ? (isDragging ? dragMove : undefined)
            : disableZoom ? undefined : zoom.dragMove;
    const onSurfaceMouseLeave = selectMode === "none"
        ? undefined
        : selectMode === "select"
            ? handleSelectionEnd
            : disableZoom ? undefined : zoom.dragEnd;
    const onSurfaceTouchStart = selectMode === "none"
        ? undefined
        : selectMode === "select"
            ? dragStart
            : disableZoom ? undefined : zoom.dragStart;
    const onSurfaceTouchEnd = selectMode === "none"
        ? undefined
        : selectMode === "select"
            ? handleSelectionEnd
            : disableZoom ? undefined : zoom.dragEnd;
    const onSurfaceTouchMove = selectMode === "none"
        ? undefined
        : selectMode === "select"
            ? (isDragging ? dragMove : undefined)
            : disableZoom ? undefined : zoom.dragMove;
    const onSurfaceWheel: React.WheelEventHandler<SVGRectElement> = (event) => {
        setShowPointAnimation(false);
        if (!disableZoom) {
            const point = localPoint(event) || { x: 0, y: 0 };
            const zoomDirection = event.deltaY < 0 ? 1.1 : 0.9;
            zoom.scale({ scaleX: zoomDirection, scaleY: zoomDirection, point });
        }
    };

    const previousDisplayedPoints = useRef<Point<T>[]>([]);

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

        if (haveDisplayedPointsChanged(previousDisplayedPoints.current, currentDisplayedPoints)) {
            onDisplayedPointsChange?.(currentDisplayedPoints);
            previousDisplayedPoints.current = currentDisplayedPoints;
        }
    }, [currentDisplayedPoints, onDisplayedPointsChange]);

    return (
        <Stack justifyContent="center" alignItems="center" direction="row" sx={{ position: "relative" }}>
            <Box sx={{ width: size, height: size }}>
                {loading ? (
                    <Box display="flex" width="100%" height="100%" sx={{ justifyContent: "center", alignItems: "center" }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <div style={{ position: "relative" }} ref={divRef}>
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
                            onMouseMove={(event) => {
                                if (isDragging) handleMouseLeave();
                                else handleMouseMove(event, zoom);
                            }}
                            onMouseLeave={handleMouseLeave}
                        >
                            <Group top={margin.top} left={margin.left}>
                                {showPointAnimation && animation && (
                                    <AnimatedPoints
                                        pointData={pointData}
                                        animation={animation}
                                        animationGroupSize={animationGroupSize}
                                        animationBuffer={animationBuffer}
                                        xScaleTransformed={xScaleTransformed}
                                        yScaleTransformed={yScaleTransformed}
                                        boundedWidth={boundedWidth}
                                        boundedHeight={boundedHeight}
                                    />
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
                                                <line x1={x - margin.left + dx - 6} y1={y - margin.top + dy} x2={x - margin.left + dx + 6} y2={y - margin.top + dy} stroke="black" strokeWidth={1} />
                                                <line x1={x - margin.left + dx} y1={y - margin.top + dy - 6} x2={x - margin.left + dx} y2={y - margin.top + dy + 6} stroke="black" strokeWidth={1} />
                                                <circle cx={x - margin.left} cy={y - margin.top} r={4} fill="transparent" stroke="black" pointerEvents="none" />
                                            </g>
                                        )}
                                    </>
                                )}
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
                                    onClick={handlePointClick}
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
                                        <AxisTop top={0} scale={xScaleTransformed} tickValues={[]} />
                                        <AxisRight scale={yScaleTransformed} tickValues={[]} left={boundedWidth} />
                                    </>
                                )}
                                <Text textAnchor="middle" verticalAnchor="end" angle={-90} fontSize={15} y={boundedHeight / 2} x={0} dx={-50}>
                                    {leftAxisLabel}
                                </Text>
                                <Text textAnchor="middle" verticalAnchor="start" fontSize={15} y={boundedHeight} x={boundedWidth / 2} dy={50}>
                                    {bottomAxisLabel}
                                </Text>
                            </Group>
                            <PointLabels
                                pointData={pointData}
                                xScaleTransformed={xScaleTransformed}
                                yScaleTransformed={yScaleTransformed}
                                boundedWidth={boundedWidth}
                                boundedHeight={boundedHeight}
                                margin={margin}
                            />
                            {backgroundGradient?.legend && (
                                <GradientLegend
                                    backgroundGradient={backgroundGradient}
                                    boundedHeight={boundedHeight}
                                    barLeft={margin.left + boundedWidth + 25}
                                    marginTop={margin.top}
                                />
                            )}
                        </svg>
                    </div>
                )}
            </Box>
        </Stack>
    );
};

export default ScatterPlotViewport;

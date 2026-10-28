import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { Box } from "@mui/material";
import { Group } from "@visx/group";
import { AxisBottom, AxisLeft, AxisRight, AxisTop } from "@visx/axis";
import { LinePath } from "@visx/shape";
import { Text } from "@visx/text";
import { curveBasis } from "@visx/curve";
import { localPoint } from "@visx/event";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { BackgroundField, ChartProps, CrosshairPosition, DimStyle, Point, SelectionMode, ZoomType } from "./types";
import { DEFAULT_HOVER_STYLE, drawCanvasPoint, getTicks, isPointVisible, partitionPointsByHover, pointKey, prepareCanvas, rescaleX, rescaleY } from "./helpers";
import { followFingers, toLocal, useDragKeys, useStableCallback, useTapToActivate, useTwoFingerGestures, useTwoFingerHint } from "../../hooks";
import { MIN_BOX, TwoFingerHint, ZoomBox, boxStart } from "../../controls";
import { ZOOM_SCALE_LIMITS } from "./PlotZoom";
import AnimatedPoints from "./AnimatedPoints";
import PointLabels from "./PointLabels";
import GradientLegend from "./GradientLegend";
import Crosshair from "./Crosshair";
import { useDragSelection } from "./hooks/useDragSelection";
import { DEFAULT_FIELD_COLORS, FIELD_LEGEND_GAP, FIELD_LEGEND_WIDTH, drawField, getFieldTicks } from "./backgroundField";

type ScatterPlotViewportProps<T extends object> = {
    /** The plot's offset from the container's left edge - see getPlotLayout. */
    left: number;
    width: number;
    height: number;
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
    hoveredPoint: Point<T> | null;
    /** Every point drawn as hovered, by pointKey - see useHoveredPointKeys. */
    hoveredPointKeys: Set<string>;
    /** Whether every point outside hoveredPointKeys is dimmed - see ChartProps' spotlight. */
    spotlit: boolean;
    dimStyle: DimStyle;
    hoverGrowth?: number;
    hoverStroke?: string;
    handleMouseMove: (event: React.MouseEvent<SVGElement>, zoom: ZoomType) => void;
    handleMouseLeave: () => void;
    onDisplayedPointsChange?: (points: Point<T>[]) => void;
    onSelectionChange?: (selectedPoints: Point<T>[]) => void;
    onPointClicked?: (point: Point<T>) => void;
    leftAxisLabel?: string;
    bottomAxisLabel?: string;
    border: boolean;
    originLine?: boolean;
    backgroundField?: BackgroundField;
    /** backgroundField as a bitmap - see useFieldRaster - shared with the minimap. */
    fieldRaster: HTMLCanvasElement | null;
    /** Crosshair position in data coordinates, or null for no crosshair. */
    crosshair?: CrosshairPosition | null;
    divRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Hover growth eases in over this long, and is dropped instantly on the way out.
 * Easing the exit too would drag a tail of still-shrinking points behind the cursor
 * whenever it sweeps across a dense plot.
 */
const HOVER_GROW_MS = 120;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** The mode a drag is in with Shift held: the box zoom while panning, and panning otherwise. */
const SHIFTED: Record<SelectionMode, SelectionMode> = { pan: "zoom", select: "pan", zoom: "pan", none: "none" };

type Spot = { x: number; y: number };
type Rect = { left: number; top: number; width: number; height: number };

/** How far into its growth a point is at `now`, having started at `start`: 0 at rest, 1 fully grown. */
const hoverAmountAt = (start: number | undefined, now: number) =>
    start === undefined ? 0 : easeOutCubic(Math.min(1, Math.max(0, (now - start) / HOVER_GROW_MS)));

const ScatterPlotViewport = <T extends object>({
    left,
    width,
    height,
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
    hoveredPoint,
    hoveredPointKeys,
    spotlit,
    dimStyle,
    hoverGrowth,
    hoverStroke,
    handleMouseMove,
    handleMouseLeave,
    onDisplayedPointsChange,
    onSelectionChange,
    onPointClicked,
    leftAxisLabel,
    bottomAxisLabel,
    border,
    originLine,
    backgroundField,
    fieldRaster,
    crosshair,
    divRef,
}: ScatterPlotViewportProps<T>) => {
    const graphRef = useRef<SVGRectElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    // When each hovered point began to grow, by pointKey. Timed per point so that when the hovered
    // set shifts - a window swept along a colorbar - points still in it keep their growth and only
    // new ones start from nothing. Painted straight onto the canvas rather than through state: a
    // redraw is ~0.3ms, a re-render per frame is not.
    const hoverStartsRef = useRef<Map<string, number>>(new Map());

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

    const { lines, isDragging, x, y, dx, dy, dragStart, dragMove, dragEnd, completeSelection, cancelSelection } =
        useDragSelection({ pointData, margin, xScale, yScale, onSelectionChange });

    // A box being drawn to zoom into, in the plot area's pixels.
    const [boxDrag, setBoxDrag] = useState<{ from: Spot; to: Spot } | null>(null);
    // A drag keeps the mode it began in, so letting go of Shift first doesn't drop it midway.
    const [dragMode, setDragMode] = useState<SelectionMode | null>(null);
    const shiftHeld = useDragKeys(() => {
        if (isDragging) cancelSelection();
        setBoxDrag(null);
    });
    const mode = dragMode ?? (shiftHeld && !disableZoom ? SHIFTED[selectMode] : selectMode);
    // In these modes a finger draws, so it isn't trying to move the plot or scroll the page.
    const fingerDraws = selectMode === "select" || selectMode === "zoom";

    // Non-passive (React's onWheel is passive), so the wheel zooms instead of scrolling the page.
    useEffect(() => {
        const graphElement = graphRef.current;
        const handleWheel = (event: WheelEvent) => { event.preventDefault(); };
        graphElement?.addEventListener('wheel', handleWheel, { passive: false });
        return () => graphElement?.removeEventListener('wheel', handleWheel);
    }, []);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const twoFingerTouchAction = useTwoFingerGestures(svgRef, {
        onStart: () => {
            cancelSelection();
            setBoxDrag(null);
            setShowPointAnimation(false);
            return zoom.transformMatrix;
        },
        onMove: ({ from, to, scale }, start) => {
            const surface = graphRef.current;
            if (!surface) return;
            zoom.setTransformMatrix(followFingers(start, toLocal(surface, from), toLocal(surface, to), scale));
        },
    }, !disableZoom);
    const hint = useTwoFingerHint(svgRef, !disableZoom && !fingerDraws);

    // The zoom holds panning inside the plot area, whose size only the plot knows.
    const { setPanExtent } = zoom;
    useEffect(() => {
        setPanExtent?.(boundedWidth, boundedHeight);
    }, [setPanExtent, boundedWidth, boundedHeight]);

    const xScaleTransformed = useMemo(
        () => rescaleX(xScale, zoom.transformMatrix.translateX, zoom.transformMatrix.scaleX),
        [xScale, zoom.transformMatrix]
    );
    const yScaleTransformed = useMemo(
        () => rescaleY(yScale, zoom.transformMatrix.translateY, zoom.transformMatrix.scaleY),
        [yScale, zoom.transformMatrix]
    );

    const currentDisplayedPoints = useMemo(
        () => pointData.filter((point) =>
            isPointVisible(xScaleTransformed(point.x), yScaleTransformed(point.y), boundedWidth, boundedHeight)
        ),
        [pointData, xScaleTransformed, yScaleTransformed, boundedWidth, boundedHeight]
    );

    // Held together as one object so the draw below depends on a single stable value rather than
    // on two props that would each have to be threaded into its dependencies.
    const hoverStyle = useMemo(
        () => ({
            growth: hoverGrowth ?? DEFAULT_HOVER_STYLE.growth,
            stroke: hoverStroke ?? DEFAULT_HOVER_STYLE.stroke,
        }),
        [hoverGrowth, hoverStroke]
    );

    // Held by its parts, so a field built inline on each render doesn't redraw every point.
    const fieldX = backgroundField?.x;
    const fieldY = backgroundField?.y;
    const fieldOpacity = backgroundField?.opacity;

    const drawPoints = useCallback((
        xST: ScaleLinear<number, number, never>,
        yST: ScaleLinear<number, number, never>,
        canvas: HTMLCanvasElement,
        /** The frame's time, which every hovered point's growth is measured to. */
        now: number
    ) => {
        const context = canvas.getContext('2d');
        // Nothing to draw before the plot has been measured.
        if (!context || boundedWidth <= 0 || boundedHeight <= 0) return;

        prepareCanvas(context, boundedWidth, boundedHeight);

        if (fieldRaster && fieldX && fieldY) {
            drawField(context, fieldRaster, fieldX, fieldY, xST, yST, boundedWidth, boundedHeight, fieldOpacity);
        }

        const { nonHovered, hovered } = partitionPointsByHover(pointData, hoveredPointKeys);
        const starts = hoverStartsRef.current;

        const drawRenderedPoint = (point: Point<T>, hoverAmount: number, dim?: DimStyle) => {
            const transformedX = xST(point.x);
            const transformedY = yST(point.y);
            if (!isPointVisible(transformedX, transformedY, boundedWidth, boundedHeight)) return;
            drawCanvasPoint(context, point, transformedX, transformedY, hoverAmount, hoverStyle, dim);
        };

        // Dimmed points first, so they're drawn beneath the rest. While spotlit, every point not hovered is.
        const dimmed: Point<T>[] = [];
        const lit: Point<T>[] = [];
        for (const point of nonHovered) (spotlit || point.dimmed ? dimmed : lit).push(point);
        dimmed.forEach((point) => drawRenderedPoint(point, 0, dimStyle));
        lit.forEach((point) => drawRenderedPoint(point, 0));
        hovered.forEach((point) =>
            drawRenderedPoint(point, hoverAmountAt(starts.get(pointKey(point)), now), point.dimmed ? dimStyle : undefined)
        );
    }, [boundedHeight, boundedWidth, hoveredPointKeys, pointData, fieldRaster, fieldX, fieldY, fieldOpacity, hoverStyle, spotlit, dimStyle]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || showPointAnimation) return;

        // Sync start times with the hovered set: kept points keep theirs, new ones start now, and
        // dropped ones are forgotten so leaving is instant. Idempotent, so a re-run for pan, zoom
        // or new pointData carries on from the sizes already reached.
        const now = performance.now();
        const starts = hoverStartsRef.current;
        for (const key of starts.keys()) {
            if (!hoveredPointKeys.has(key)) starts.delete(key);
        }
        let latestStart = -Infinity;
        for (const key of hoveredPointKeys) {
            if (!starts.has(key)) starts.set(key, now);
            latestStart = Math.max(latestStart, starts.get(key)!);
        }

        // Nothing still growing: repaint once, so panning over a hovered point doesn't queue frames.
        const grownAt = latestStart + HOVER_GROW_MS;
        if (now >= grownAt) {
            drawPoints(xScaleTransformed, yScaleTransformed, canvas, now);
            return;
        }

        // Until the newest point has grown; the last frame is drawn at or past grownAt, so every
        // point ends at full size.
        let frame = requestAnimationFrame(function step() {
            const time = performance.now();
            drawPoints(xScaleTransformed, yScaleTransformed, canvas, time);
            if (time < grownAt) frame = requestAnimationFrame(step);
        });

        return () => cancelAnimationFrame(frame);
    }, [drawPoints, xScaleTransformed, yScaleTransformed, showPointAnimation, hoveredPointKeys]);

    const tap = useTapToActivate<Point<T>>();
    useEffect(() => tap.hover(hoveredPoint), [tap, hoveredPoint]);
    const handlePointClick = useCallback(() => {
        if (hoveredPoint && tap.activates(hoveredPoint)) onPointClicked?.(hoveredPoint);
    }, [hoveredPoint, onPointClicked, tap]);

    const surfaceCursor = disableZoom
        ? selectable
            ? isDragging ? 'none' : 'crosshair'
            : isDragging ? 'none' : 'default'
        : mode === 'zoom'
            ? 'crosshair'
            : hoveredPoint
                ? 'default'
                : mode === 'select'
                    ? isDragging ? 'none' : 'crosshair'
                    : zoom.isDragging
                        ? 'grabbing'
                        : 'grab';

    const handleSelectionEnd = (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
        dragEnd(event);
        completeSelection(zoom);
    };

    /**
     * Panning is coalesced to one zoom update per frame. React flushes mousemove updates
     * synchronously, and a shared zoom re-renders every synced plot, so handling each move
     * outright never lets the browser paint and eventually exceeds React's update depth.
     *
     * The buffer holds nativeEvent, since React clears the synthetic event's currentTarget after
     * dispatch, and useStableCallback makes the frame use the current zoom.
     */
    const dragFrameRef = useRef<number | null>(null);
    const pendingDragRef = useRef<MouseEvent | null>(null);
    const dragMoveLatest = useStableCallback((event: MouseEvent) => {
        zoom.dragMove(event as unknown as React.MouseEvent);
    });

    const flushPendingDrag = useCallback(() => {
        if (dragFrameRef.current !== null) {
            cancelAnimationFrame(dragFrameRef.current);
            dragFrameRef.current = null;
        }
        const pending = pendingDragRef.current;
        pendingDragRef.current = null;
        if (pending) dragMoveLatest(pending);
    }, [dragMoveLatest]);

    useEffect(() => () => {
        if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
    }, []);

    const onZoomDragMove = (event: React.MouseEvent<SVGRectElement>) => {
        pendingDragRef.current = event.nativeEvent;
        if (dragFrameRef.current !== null) return;
        dragFrameRef.current = requestAnimationFrame(() => {
            dragFrameRef.current = null;
            const pending = pendingDragRef.current;
            pendingDragRef.current = null;
            if (pending) dragMoveLatest(pending);
        });
    };

    // The queued frame is applied before the gesture closes, so the plot lands on the position
    // the pointer was actually released at rather than a frame behind it.
    const onZoomDragEnd = () => {
        flushPendingDrag();
        zoom.dragEnd();
    };

    const lassoing = mode === "select";
    const panning = mode === "pan" && !disableZoom;
    const onSurfaceMouseDown = lassoing
        ? (event: React.MouseEvent<SVGRectElement>) => { setDragMode("select"); dragStart(event); }
        : panning
            ? (event: React.MouseEvent<SVGRectElement>) => { setDragMode("pan"); zoom.dragStart(event); }
            : undefined;
    // Leaving the plot ends a drag as letting go does.
    const onSurfaceMouseUp = lassoing
        ? (event: React.MouseEvent<SVGRectElement>) => { setDragMode(null); handleSelectionEnd(event); }
        : panning
            ? () => { setDragMode(null); onZoomDragEnd(); }
            : undefined;
    const onSurfaceMouseMove = lassoing ? (isDragging ? dragMove : undefined) : panning ? onZoomDragMove : undefined;
    // One finger only draws selections and boxes; otherwise it scrolls the page.
    const onSurfaceTouchStart = lassoing ? dragStart : undefined;
    const onSurfaceTouchEnd = lassoing ? handleSelectionEnd : undefined;
    const onSurfaceTouchMove = lassoing && isDragging ? dragMove : undefined;

    /**
     * The box a drag zooms into, which is what the plot will show: the plot's own shape, so the
     * points keep theirs, and the smallest that covers the drag and the zoom can still fill the
     * plot with. Inside the plot, and none for a drag too short to mean one.
     */
    const boxOf = (from: Spot, to: Spot): Rect | null => {
        const end = {
            x: Math.min(Math.max(to.x, 0), boundedWidth),
            y: Math.min(Math.max(to.y, 0), boundedHeight),
        };
        const across = Math.abs(end.x - from.x);
        const down = Math.abs(end.y - from.y);
        if (Math.max(across, down) < MIN_BOX) return null;
        const aspect = boundedWidth / boundedHeight;
        const closest = (boundedWidth * zoom.transformMatrix.scaleX) / ZOOM_SCALE_LIMITS.scaleXMax;
        const width = Math.min(boundedWidth, Math.max(across, down * aspect, closest));
        const height = width / aspect;
        return {
            left: boxStart(from.x, end.x, width, boundedWidth),
            top: boxStart(from.y, end.y, height, boundedHeight),
            width,
            height,
        };
    };
    /** Zooms both axes alike, so the box boxOf gave fills the plot. */
    const zoomToBox = ({ left, top, width, height }: Rect) => {
        const matrix = zoom.transformMatrix;
        const factor = boundedWidth / width;
        const scaleX = matrix.scaleX * factor;
        const scaleY = matrix.scaleY * factor;
        // The box's center, unzoomed: a point p shows at scale·p + translate.
        const centerX = (left + width / 2 - matrix.translateX) / matrix.scaleX;
        const centerY = (top + height / 2 - matrix.translateY) / matrix.scaleY;
        zoom.setTransformMatrix({
            ...matrix,
            scaleX,
            scaleY,
            translateX: boundedWidth / 2 - scaleX * centerX,
            translateY: boundedHeight / 2 - scaleY * centerY,
        });
    };
    // The box is drawn with pointer events, captured so it follows past the plot's edge, and one
    // handler serves the mouse and a finger alike.
    const onSurfacePointerDown = (event: React.PointerEvent<SVGRectElement>) => {
        // A second finger is a pinch.
        if (!event.isPrimary) return setBoxDrag(null);
        if (mode !== "zoom" || disableZoom || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const from = toLocal(event.currentTarget, event);
        setDragMode("zoom");
        setShowPointAnimation(false);
        setBoxDrag({ from, to: from });
    };
    const onSurfacePointerMove = (event: React.PointerEvent<SVGRectElement>) => {
        if (boxDrag) setBoxDrag({ from: boxDrag.from, to: toLocal(event.currentTarget, event) });
    };
    const onSurfacePointerUp = (event: React.PointerEvent<SVGRectElement>) => {
        if (dragMode === "zoom") setDragMode(null);
        if (!boxDrag) return;
        setBoxDrag(null);
        const target = boxOf(boxDrag.from, toLocal(event.currentTarget, event));
        if (target) zoomToBox(target);
    };
    const onSurfacePointerCancel = () => {
        if (dragMode === "zoom") setDragMode(null);
        setBoxDrag(null);
    };
    const box = boxDrag && boxOf(boxDrag.from, boxDrag.to);
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
                    point.opacity === nextPoint.opacity &&
                    point.dimmed === nextPoint.dimmed
                );
            });
        };

        if (haveDisplayedPointsChanged(previousDisplayedPoints.current, currentDisplayedPoints)) {
            onDisplayedPointsChange?.(currentDisplayedPoints);
            previousDisplayedPoints.current = currentDisplayedPoints;
        }
    }, [currentDisplayedPoints, onDisplayedPointsChange]);

    const legendLeft = margin.left + boundedWidth + FIELD_LEGEND_GAP;
    const fieldLegend = backgroundField?.legend;
    const legend = typeof fieldLegend === "function" ? (
        <Group top={margin.top} left={legendLeft}>
            {fieldLegend({ width: FIELD_LEGEND_WIDTH, height: boundedHeight })}
        </Group>
    ) : backgroundField && fieldLegend ? (
        <GradientLegend
            colors={backgroundField.colorScale ?? DEFAULT_FIELD_COLORS}
            ticks={getFieldTicks(backgroundField.domain, boundedHeight, fieldLegend.format)}
            label={fieldLegend.label}
            boundedHeight={boundedHeight}
            barLeft={legendLeft}
            marginTop={margin.top}
        />
    ) : null;

    return (
        <Box sx={{ position: "relative", marginLeft: `${left}px`, width, height }}>
            {loading ? (
                <Box display="flex" width="100%" height="100%" sx={{ justifyContent: "center", alignItems: "center" }}>
                    <CircularProgress />
                </Box>
            ) : (
                <div style={{ position: "relative" }} ref={divRef}>
                    <canvas
                        ref={canvasRef}
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
                        ref={svgRef}
                        width={width}
                        height={height}
                        overflow="visible"
                        style={{
                            position: "absolute",
                            userSelect: "none",
                            touchAction: fingerDraws ? "none" : twoFingerTouchAction,
                        }}
                        onMouseMove={(event) => {
                            if (isDragging || boxDrag) handleMouseLeave();
                            else handleMouseMove(event, zoom);
                        }}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Group top={margin.top} left={margin.left}>
                            {showPointAnimation && animation && (
                                <AnimatedPoints
                                    pointData={pointData}
                                    dimStyle={dimStyle}
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
                                onMouseLeave={onSurfaceMouseUp}
                                onPointerDown={onSurfacePointerDown}
                                onPointerMove={onSurfacePointerMove}
                                onPointerUp={onSurfacePointerUp}
                                onPointerCancel={onSurfacePointerCancel}
                                onTouchStart={onSurfaceTouchStart}
                                onTouchEnd={onSurfaceTouchEnd}
                                onTouchMove={onSurfaceTouchMove}
                                onWheel={onSurfaceWheel}
                                onClick={handlePointClick}
                            />
                            {crosshair && !isDragging && !boxDrag && (
                                <Crosshair
                                    position={{
                                        x: xScaleTransformed(crosshair.x),
                                        y: yScaleTransformed(crosshair.y),
                                    }}
                                    boundedWidth={boundedWidth}
                                    boundedHeight={boundedHeight}
                                />
                            )}
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
                        {legend}
                    </svg>
                    {box && (
                        <ZoomBox box={box} area={{ left: margin.left, top: margin.top, width: boundedWidth, height: boundedHeight }} />
                    )}
                    <TwoFingerHint
                        shown={hint}
                        style={{ top: margin.top, left: margin.left, width: boundedWidth, height: boundedHeight }}
                    />
                </div>
            )}
        </Box>
    );
};

export default ScatterPlotViewport;

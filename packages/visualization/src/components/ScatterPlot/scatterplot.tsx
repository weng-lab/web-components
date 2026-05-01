import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Zoom as VisxZoom } from '@visx/zoom'
import { ZoomProps } from '@visx/zoom/lib/Zoom'
import { ChartProps, Point, ZoomType } from './types';
import { Tooltip as VisxTooltip } from '@visx/tooltip';
import { TooltipProps } from '@visx/tooltip/lib/tooltips/Tooltip';
import { scaleLinear } from '@visx/scale';
import { localPoint } from '@visx/event';
import ControlButtons from './controls';
import { Stack } from '@mui/material';
import { ScaleLinear } from '@visx/vendor/d3-scale';
import { useParentSize } from '@visx/responsive';
import { downloadDivAsPNG, downloadDivAsSVG } from '../../utility';
import { drawCanvasPoint, getPointExtents, isPointVisible, partitionPointsByHover, prepareCanvas, rescaleX, rescaleY } from './helpers';
import ScatterPlotViewport from './ScatterPlotViewport';
import { useScatterPlotInteraction } from './useScatterPlotInteraction';

const initialTransformMatrix = {
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
    skewX: 0,
    skewY: 0,
}

const ScatterPlot = <T extends object, S extends boolean | undefined = undefined, Z extends boolean | undefined = undefined>(
    props: ChartProps<T, S, Z>
) => {
    /**
 * Hacky workaround for complex type compatability issues. Hopefully this will fix itself when ugrading to React 19 - Jonathan 12/11/24
 * @todo remove this when possible
 */
    const Zoom = VisxZoom as unknown as React.FC<ZoomProps<React.ReactElement>>;
    const VisTooltip = VisxTooltip as unknown as React.FC<TooltipProps>;

    const initialState: {
        minimap: { open: boolean };
        controls: { selectionType: "pan" | "select" | "none" }
    } = {
        minimap: {
            open: props.initialState?.minimap?.open ?? false,
        },
        controls: {
            selectionType: props.initialState?.controls?.selectionType ? props.initialState?.controls?.selectionType : props.selectable ? "select" : "pan",
        }
    }

    const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();
    const size = Math.min(parentHeight, parentWidth)

    const divRef = React.useRef<HTMLDivElement>(null);
    const selectable = props.selectable ? props.selectable : false;
    const margin = { top: 20, right: 20, bottom: 70, left: 70 };
    const boundedWidth = Math.min(size * 0.9, size * 0.9) - margin.left;
    const boundedHeight = boundedWidth;
    const downloadButton = props.downloadButton ?? false
    const [showPointAnimation, setShowPointAnimation] = useState(Boolean(props.animation));

    useEffect(() => {
        if (!props.animation) return;
        if(props.pointData.length > 2500) {
            setShowPointAnimation(false);
            return;
        }
        const duration = 450;
        const buffer = (props.animationBuffer ?? 0.03) * 1000;
        const groups = Math.ceil(props.pointData.length / (props.animationGroupSize ?? 1));
        const total = duration + groups * buffer;

        const t = window.setTimeout(() => setShowPointAnimation(false), total);
        return () => window.clearTimeout(t);
    }, [props.animation, props.animationBuffer, props.animationGroupSize, props.pointData.length]);

    const pointExtents = useMemo(() => getPointExtents(props.pointData), [props.pointData]);

    //scales for the x and y axes
    const xScale = useMemo(() => {
        return scaleLinear({
            domain: [pointExtents.x[0] - 1, pointExtents.x[1] + 1],
            range: [0, boundedWidth],
        });
    }, [boundedWidth, pointExtents]);

    const yScale = useMemo(() => {
        return scaleLinear({
            domain: [pointExtents.y[0] - 1, pointExtents.y[1] + 1],
            range: [boundedHeight, 0], // Y-axis is inverted
        });
    }, [boundedHeight, pointExtents]);

    const {
        graphRef,
        tooltipData,
        tooltipOpen,
        lines,
        selectMode,
        showMiniMap,
        mouseX,
        mouseY,
        hoveredPoint,
        isDragging,
        x,
        y,
        dx,
        dy,
        dragStart,
        dragEnd,
        dragMove,
        handleSelectionModeChange,
        toggleMiniMap,
        completeSelection,
        handleMouseMove,
        handleMouseLeave,
        handlePointClick,
    } = useScatterPlotInteraction({
        pointData: props.pointData,
        selectable,
        initialSelectionMode: initialState.controls.selectionType,
        initialMiniMapOpen: initialState.minimap.open,
        margin,
        xScale,
        yScale,
        onSelectionChange: props.onSelectionChange,
        onPointClicked: props.onPointClicked,
    });

    useEffect(() => {
        const graphElement = graphRef.current;

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
        };

        const handleTouchMove = (event: TouchEvent) => {
            event.preventDefault();
        };

        const handleTouchStart = (event: TouchEvent) => {
            event.preventDefault();
        };

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

    const groupedPoints: Point<T>[] = useMemo(() => {
        const anchor = props.groupPointsAnchor
        if (anchor && hoveredPoint) {
            return props.pointData.filter((point) => {
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
    }, [hoveredPoint, props.groupPointsAnchor, props.pointData])

    const hoveredPointKeys = useMemo(
        () => new Set(groupedPoints.map((point) => `${point.x},${point.y}`)),
        [groupedPoints]
    );

    const displayedPoints = useCallback(
        (xScaleTransformed: ScaleLinear<number, number, never>, yScaleTransformed: ScaleLinear<number, number, never>) => (
            props.pointData.filter((point) => {
                const transformedX = xScaleTransformed(point.x);
                const transformedY = yScaleTransformed(point.y);
                return (
                    transformedX >= 0 &&
                    transformedX <= boundedWidth &&
                    transformedY >= 0 &&
                    transformedY <= boundedHeight
                );
            })
        ),
        [boundedHeight, boundedWidth, props.pointData]
    );

    const drawPoints = useCallback((xScaleTransformed: ScaleLinear<number, number, never>, yScaleTransformed: ScaleLinear<number, number, never>, canvas: HTMLCanvasElement) => {
        const context = canvas.getContext('2d');
        if (!context) return;

        prepareCanvas(context, boundedWidth, boundedHeight);
        const { nonHovered, hovered } = partitionPointsByHover(props.pointData, hoveredPointKeys);

        const drawRenderedPoint = (point: Point<T>, isHovered: boolean) => {
            const transformedX = xScaleTransformed(point.x);
            const transformedY = yScaleTransformed(point.y);
            if (!isPointVisible(transformedX, transformedY, boundedWidth, boundedHeight)) return;
            drawCanvasPoint(context, point, transformedX, transformedY, isHovered);
        };

        nonHovered.forEach((point) => drawRenderedPoint(point, false));
        hovered.forEach((point) => drawRenderedPoint(point, true));
    }, [boundedHeight, boundedWidth, hoveredPointKeys, props.pointData])

    //Download the plot as svg or png using the passed ref from the parent
    useImperativeHandle(props.ref, () => ({
        downloadSVG: () => {
            if (divRef.current) downloadDivAsSVG(divRef.current, props.downloadFileName ?? "scatter_plot.svg");
        },
        downloadPNG: () => {
            if (divRef.current) downloadDivAsPNG(divRef.current, props.downloadFileName ?? "scatter_plot.png");
        },
    }));

    //internal download if user wants to use hardcoded button
    const handleDownload = () => {
        if (divRef.current) downloadDivAsSVG(divRef.current, props.downloadFileName ?? "scatter_plot.svg");
    };


    return (
        <div ref={parentRef} style={{ width: "100%", height: "100%", position: "relative" }}>
            <Zoom width={boundedWidth} height={boundedHeight} scaleXMin={1 / 2} scaleXMax={10} scaleYMin={1 / 2} scaleYMax={10} initialTransformMatrix={initialTransformMatrix}>
                {(zoom) => {
                    // rescale as we zoom and pan
                    const xScaleTransformed = rescaleX(xScale, zoom.transformMatrix.translateX, zoom.transformMatrix.scaleX);
                    const yScaleTransformed = rescaleY(yScale, zoom.transformMatrix.translateY, zoom.transformMatrix.scaleY);
                    const isHoveredPointWithinBounds = Boolean(hoveredPoint &&
                        xScaleTransformed(hoveredPoint.x) >= 0 &&
                        xScaleTransformed(hoveredPoint.x) <= boundedWidth &&
                        yScaleTransformed(hoveredPoint.y) >= 0 &&
                        yScaleTransformed(hoveredPoint.y) <= boundedHeight);

                    const handleZoomIn = () => {
                        zoom.scale({ scaleX: 1.2, scaleY: 1.2 });
                    }

                    const handleZoomOut = () => {
                        zoom.scale({ scaleX: 0.8, scaleY: 0.8 });
                    }

                    const handleZoomReset = () => {
                        zoom.reset();
                    }
                    const currentDisplayedPoints = displayedPoints(xScaleTransformed, yScaleTransformed);

                    const surfaceCursor = props.disableZoom
                        ? props.selectable
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
                            : props.disableZoom
                                ? undefined
                                : zoom.dragStart;
                    const onSurfaceMouseUp = selectMode === "none"
                        ? undefined
                        : selectMode === "select"
                            ? handleSelectionEnd
                            : props.disableZoom
                                ? undefined
                                : zoom.dragEnd;
                    const onSurfaceMouseMove = selectMode === "none"
                        ? undefined
                        : selectMode === "select"
                            ? (isDragging ? dragMove : undefined)
                            : props.disableZoom
                                ? undefined
                                : zoom.dragMove;
                    const onSurfaceMouseLeave = selectMode === "none"
                        ? undefined
                        : selectMode === "select"
                            ? handleSelectionEnd
                            : props.disableZoom
                                ? undefined
                                : zoom.dragEnd;
                    const onSurfaceTouchStart = selectMode === "none"
                        ? undefined
                        : selectMode === "select"
                            ? dragStart
                            : props.disableZoom
                                ? undefined
                                : zoom.dragStart;
                    const onSurfaceTouchEnd = selectMode === "none"
                        ? undefined
                        : selectMode === "select"
                            ? handleSelectionEnd
                            : props.disableZoom
                                ? undefined
                                : zoom.dragEnd;
                    const onSurfaceTouchMove = selectMode === "none"
                        ? undefined
                        : selectMode === "select"
                            ? (isDragging ? dragMove : undefined)
                            : props.disableZoom
                                ? undefined
                                : zoom.dragMove;
                    const onSurfaceWheel: React.WheelEventHandler<SVGRectElement> = (event) => {
                        setShowPointAnimation(false);
                        if (!props.disableZoom) {
                            const point = localPoint(event) || { x: 0, y: 0 };
                            const zoomDirection = event.deltaY < 0 ? 1.1 : 0.9;
                            zoom.scale({ scaleX: zoomDirection, scaleY: zoomDirection, point });
                        }
                    };

                    return (
                        <>
                            {!props.disableZoom && (
                                <Stack
                                    direction="column"
                                    sx={{
                                        position: 'absolute',
                                        left: `max(10px, calc(45% - ${size / 2}px))`,
                                        top: `calc(50% - ${size / 2}px + ${margin.top}px)`,
                                        zIndex: 10
                                    }}
                                >
                                    <ControlButtons
                                        selectable={selectable}
                                        resetable={zoom.transformMatrix !== zoom.initialTransformMatrix}
                                        handleSelectionModeChange={handleSelectionModeChange}
                                        selectMode={selectMode}
                                        zoomIn={handleZoomIn}
                                        zoomOut={handleZoomOut}
                                        zoomReset={handleZoomReset}
                                        highlight={props.controlsHighlight}
                                        downloadButton={downloadButton}
                                        downloadPlot={handleDownload}
                                    />
                                </Stack>
                            )}
                            <ScatterPlotViewport
                                size={size}
                                margin={margin}
                                boundedWidth={boundedWidth}
                                boundedHeight={boundedHeight}
                                loading={props.loading}
                                pointData={props.pointData}
                                showPointAnimation={showPointAnimation}
                                animation={props.animation}
                                animationGroupSize={props.animationGroupSize}
                                animationBuffer={props.animationBuffer}
                                xScale={xScale}
                                yScale={yScale}
                                xScaleTransformed={xScaleTransformed}
                                yScaleTransformed={yScaleTransformed}
                                displayedPoints={currentDisplayedPoints}
                                onDisplayedPointsChange={props.onDisplayedPointsChange}
                                drawPoints={drawPoints}
                                divRef={divRef}
                                handleMouseMove={handleMouseMove}
                                handleMouseLeave={handleMouseLeave}
                                zoom={zoom}
                                selectMode={selectMode}
                                lines={lines}
                                isDragging={isDragging}
                                x={x}
                                y={y}
                                dx={dx}
                                dy={dy}
                                graphRef={graphRef}
                                surfaceCursor={surfaceCursor}
                                onSurfaceMouseDown={onSurfaceMouseDown}
                                onSurfaceMouseUp={onSurfaceMouseUp}
                                onSurfaceMouseMove={onSurfaceMouseMove}
                                onSurfaceMouseLeave={onSurfaceMouseLeave}
                                onSurfaceTouchStart={onSurfaceTouchStart}
                                onSurfaceTouchEnd={onSurfaceTouchEnd}
                                onSurfaceTouchMove={onSurfaceTouchMove}
                                onSurfaceWheel={onSurfaceWheel}
                                onSurfaceClick={handlePointClick}
                                leftAxisLabel={props.leftAxisLabel}
                                bottomAxisLabel={props.bottomAxisLabel}
                                miniMap={props.miniMap}
                                disableZoom={props.disableZoom}
                                showMiniMap={showMiniMap}
                                toggleMiniMap={toggleMiniMap}
                                controlsHighlight={props.controlsHighlight}
                                disableTooltip={props.disableTooltip}
                                tooltipOpen={tooltipOpen}
                                tooltipData={tooltipData}
                                tooltipBody={props.tooltipBody}
                                isHoveredPointWithinBounds={isHoveredPointWithinBounds}
                                mouseX={mouseX}
                                mouseY={mouseY}
                                VisTooltip={VisTooltip as React.FC<{ left?: number; top?: number; children?: React.ReactNode }>}
                            />
                        </>
                    )
                }}
            </Zoom >
        </div>
    );
}

export default ScatterPlot;

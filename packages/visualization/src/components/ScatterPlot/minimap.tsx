import { useEffect, useRef } from "react";
import { MapProps } from "./types";
import { CROSSHAIR_DASH, CROSSHAIR_STROKE, CROSSHAIR_STROKE_WIDTH } from "./Crosshair";
import { useStableCallback } from "../../hooks";

const MINIMAP_SCALE_FACTOR = 0.25;
// The crosshair is drawn inside the scaled group, so its stroke and dashes shrink with it.
// Scale them back up so it renders identically to the crosshair on the plot itself.
const MINIMAP_CROSSHAIR_STROKE_WIDTH = CROSSHAIR_STROKE_WIDTH / MINIMAP_SCALE_FACTOR;
const MINIMAP_CROSSHAIR_DASH = CROSSHAIR_DASH.map((dash) => dash / MINIMAP_SCALE_FACTOR).join(",");

const MiniMap = <T,>({
    miniMap,
    width,
    height,
    pointData,
    xScale,
    yScale,
    zoom,
    crosshair
}: MapProps<T>) => {
    // The minimap frame is the whole plot area untransformed, so a data coordinate maps onto it
    // through the base scales - no need to undo the current zoom.
    const crosshairX = crosshair ? xScale(crosshair.x) : null;
    const crosshairY = crosshair ? yScale(crosshair.y) : null;
    const frameWidth = width - 100;
    const frameHeight = height - 100;

    /**
     * Dragging the window is coalesced to one zoom update per animation frame.
     *
     * This handler sets the transform matrix directly rather than going through zoom.dragMove,
     * so it needs its own coalescing: without it a mouse reporting faster than the browser
     * paints updates a zoom shared by every synced plot on each move, and React eventually
     * warns that the update depth was exceeded.
     *
     * Each frame places the window by the pointer's distance from where it was grabbed, so it
     * stays under the pointer, and only the latest position matters. Adding up each move's
     * movementX instead drifted: its units follow the screen rather than the page, so under
     * browser zoom the window ran ahead of or behind the pointer, and each step was added to a
     * pan that could still be a render behind.
     */
    const frameRef = useRef<number | null>(null);
    const grabRef = useRef<{ x: number; y: number; translateX: number; translateY: number } | null>(null);
    const pendingRef = useRef<{ x: number; y: number } | null>(null);

    const flushPan = useStableCallback(() => {
        const pending = pendingRef.current;
        const grab = grabRef.current;
        pendingRef.current = null;
        if (!pending || !grab) return;

        zoom.setTransformMatrix({
            ...zoom.transformMatrix,
            translateX: grab.translateX - (pending.x - grab.x) / MINIMAP_SCALE_FACTOR * zoom.transformMatrix.scaleX,
            translateY: grab.translateY - (pending.y - grab.y) / MINIMAP_SCALE_FACTOR * zoom.transformMatrix.scaleY,
        });
    });

    const startPan = (x: number, y: number) => {
        grabRef.current = { x, y, translateX: zoom.transformMatrix.translateX, translateY: zoom.transformMatrix.translateY };
    };

    const movePan = (x: number, y: number) => {
        if (!grabRef.current) return;
        pendingRef.current = { x, y };
        if (frameRef.current !== null) return;
        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;
            flushPan();
        });
    };

    // Apply whatever is still queued before the gesture closes, so the window lands where the
    // pointer left it rather than a frame behind.
    const endPan = () => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        flushPan();
        grabRef.current = null;
        zoom.dragEnd();
    };

    useEffect(() => () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    }, []);

    return (
        <div
            style={{
                position: 'absolute',
                bottom: miniMap.position ? miniMap.position.bottom : 10,
                right: miniMap.position ? miniMap.position.right : 10,
            }}
        >
            {/* Canvas for rendering points on minimap */}
            <canvas
                width={frameWidth * MINIMAP_SCALE_FACTOR}
                height={frameHeight * MINIMAP_SCALE_FACTOR}
                ref={(canvas) => {
                    if (canvas) {
                        const context = canvas.getContext('2d');
                        const scaleFactor = MINIMAP_SCALE_FACTOR;
                        const scaledWidth = frameWidth * scaleFactor;
                        const scaledHeight = frameHeight * scaleFactor;
                        if (context) {
                            // Clear canvas
                            context.clearRect(0, 0, canvas.width, canvas.height);

                            // Draw background and outline
                            context.fillStyle = 'white';
                            context.fillRect(0, 0, scaledWidth, scaledHeight);
                            context.strokeStyle = 'grey';
                            context.lineWidth = 4;
                            context.strokeRect(0, 0, scaledWidth, scaledHeight);

                            // Draw points
                            pointData.forEach(point => {
                                const transformedX = xScale(point.x) * scaleFactor;
                                const transformedY = yScale(point.y) * scaleFactor;
                                context.beginPath();
                                context.arc(transformedX, transformedY, 3 * scaleFactor, 0, Math.PI * 2);
                                context.fillStyle = point.color ?? "black";
                                context.fill();
                            });
                        }
                    }
                }}
                style={{ display: 'block' }}
            />

            {/* SVG for rendering the zoom window */}
            <svg
                width={frameWidth * MINIMAP_SCALE_FACTOR}
                height={frameHeight * MINIMAP_SCALE_FACTOR}
                style={{ position: 'absolute', top: 0, left: 0 }}
            >
                <g transform={`scale(${MINIMAP_SCALE_FACTOR})`}>
                    <rect
                        width={frameWidth}
                        height={frameHeight}
                        fill="#0d0f98"
                        fillOpacity={0.2}
                        stroke="#0d0f98"
                        strokeWidth={4}
                        rx={8}
                        transform={zoom.toStringInvert()}
                        //drag functionality for window, must invert zoom and take the scale into account
                        style={{ cursor: zoom.isDragging ? "grabbing" : "grab", touchAction: "none" }}
                        // A mouse or pen drags through pointer events, captured so a quick move
                        // off the window doesn't drop it. Touch keeps its own handlers below.
                        onPointerDown={(event) => {
                            if (event.pointerType === "touch") return;
                            event.currentTarget.setPointerCapture(event.pointerId);
                            startPan(event.clientX, event.clientY);
                            zoom.dragStart(event);
                        }}
                        onPointerMove={(event) => {
                            if (event.pointerType !== "touch") movePan(event.clientX, event.clientY);
                        }}
                        onPointerUp={(event) => {
                            if (event.pointerType !== "touch") endPan();
                        }}
                        onLostPointerCapture={(event) => {
                            if (event.pointerType !== "touch" && grabRef.current) endPan();
                        }}
                        onTouchStart={(event) => {
                            const touch = event.touches[0];
                            if (touch) startPan(touch.clientX, touch.clientY);
                            zoom.dragStart(event);
                        }}
                        onTouchEnd={endPan}
                        onTouchCancel={endPan}
                        onTouchMove={(event) => {
                            // Only a single finger pans; a second one is a pinch, which belongs
                            // to the plot's own zoom rather than to this window.
                            if (event.touches.length !== 1) return;
                            const touch = event.touches[0];
                            movePan(touch.clientX, touch.clientY);
                        }}
                    />
                    {crosshairY !== null && crosshairY >= 0 && crosshairY <= frameHeight && (
                        <line
                            x1={0}
                            x2={frameWidth}
                            y1={crosshairY}
                            y2={crosshairY}
                            stroke={CROSSHAIR_STROKE}
                            strokeWidth={MINIMAP_CROSSHAIR_STROKE_WIDTH}
                            strokeDasharray={MINIMAP_CROSSHAIR_DASH}
                            pointerEvents="none"
                        />
                    )}
                    {crosshairX !== null && crosshairX >= 0 && crosshairX <= frameWidth && (
                        <line
                            x1={crosshairX}
                            x2={crosshairX}
                            y1={0}
                            y2={frameHeight}
                            stroke={CROSSHAIR_STROKE}
                            strokeWidth={MINIMAP_CROSSHAIR_STROKE_WIDTH}
                            strokeDasharray={MINIMAP_CROSSHAIR_DASH}
                            pointerEvents="none"
                        />
                    )}
                </g>
            </svg>
        </div>
    );
};

export default MiniMap;
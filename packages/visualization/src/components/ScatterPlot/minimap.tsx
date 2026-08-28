import { MapProps } from "./types";
import { CROSSHAIR_DASH, CROSSHAIR_STROKE, CROSSHAIR_STROKE_WIDTH } from "./Crosshair";

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
                        style={{ cursor: zoom.isDragging ? "grabbing" : "grab" }}
                        onMouseDown={zoom.dragStart}
                        onMouseUp={zoom.dragEnd}
                        onMouseMove={(event) => {
                            if (zoom.isDragging) {
                                zoom.setTransformMatrix({
                                    scaleX: zoom.transformMatrix.scaleX,
                                    scaleY: zoom.transformMatrix.scaleY,
                                    translateX: zoom.transformMatrix.translateX - event.movementX / .25 * zoom.transformMatrix.scaleX,
                                    translateY: zoom.transformMatrix.translateY - event.movementY / .25 * zoom.transformMatrix.scaleY,
                                    skewX: zoom.transformMatrix.skewX,
                                    skewY: zoom.transformMatrix.skewY
                                });
                            }
                        }}
                        onMouseLeave={zoom.dragEnd}
                        onTouchStart={zoom.dragStart}
                        onTouchEnd={zoom.dragEnd}
                        onTouchMove={(event) => {
                            if (zoom.isDragging && event.touches.length === 1) {
                                const touch = event.touches[0];
                                zoom.setTransformMatrix({
                                    scaleX: zoom.transformMatrix.scaleX,
                                    scaleY: zoom.transformMatrix.scaleY,
                                    translateX: zoom.transformMatrix.translateX - touch.clientX / .25,
                                    translateY: zoom.transformMatrix.translateY - touch.clientY / .25,
                                    skewX: zoom.transformMatrix.skewX,
                                    skewY: zoom.transformMatrix.skewY
                                });
                            }
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
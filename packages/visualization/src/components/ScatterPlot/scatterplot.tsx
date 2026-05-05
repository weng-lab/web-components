import React, { useImperativeHandle, useMemo } from 'react';
import { Zoom as VisxZoom } from '@visx/zoom'
import { ZoomProps } from '@visx/zoom/lib/Zoom'
import { ChartProps } from './types';
import { scaleLinear } from '@visx/scale';
import ControlButtons from './controls';
import { Stack } from '@mui/material';
import { useParentSize } from '@visx/responsive';
import { downloadDivAsPNG, downloadDivAsSVG } from '../../utility';
import { getPointExtents } from './helpers';
import ScatterPlotViewport from './ScatterPlotViewport';
import { useSelectionMode } from './hooks/useSelectionMode';

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

    const { selectMode, handleSelectionModeChange } = useSelectionMode({
        initialSelectionMode: initialState.controls.selectionType,
    });

    const pointExtents = useMemo(() => getPointExtents(props.pointData), [props.pointData]);

    const xScale = useMemo(() => {
        return scaleLinear({
            domain: [pointExtents.x[0] - 1, pointExtents.x[1] + 1],
            range: [0, boundedWidth],
        });
    }, [boundedWidth, pointExtents]);

    const yScale = useMemo(() => {
        return scaleLinear({
            domain: [pointExtents.y[0] - 1, pointExtents.y[1] + 1],
            range: [boundedHeight, 0],
        });
    }, [boundedHeight, pointExtents]);

    //Download the plot as svg or png using the passed ref from the parent
    useImperativeHandle(props.ref, () => ({
        downloadSVG: () => {
            if (divRef.current) downloadDivAsSVG(divRef.current, props.downloadFileName ?? "scatter_plot.svg");
        },
        downloadPNG: () => {
            if (divRef.current) downloadDivAsPNG(divRef.current, props.downloadFileName ?? "scatter_plot.png");
        },
    }));

    const handleDownload = () => {
        if (divRef.current) downloadDivAsSVG(divRef.current, props.downloadFileName ?? "scatter_plot.svg");
    };

    return (
        <div ref={parentRef} style={{ width: "100%", height: "100%", position: "relative" }}>
            <Zoom width={boundedWidth} height={boundedHeight} scaleXMin={1 / 2} scaleXMax={10} scaleYMin={1 / 2} scaleYMax={10} initialTransformMatrix={initialTransformMatrix}>
                {(zoom) => {
                    const handleZoomIn = () => { zoom.scale({ scaleX: 1.2, scaleY: 1.2 }); }
                    const handleZoomOut = () => { zoom.scale({ scaleX: 0.8, scaleY: 0.8 }); }
                    const handleZoomReset = () => { zoom.reset(); }

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
                                animation={props.animation}
                                animationGroupSize={props.animationGroupSize}
                                animationBuffer={props.animationBuffer}
                                xScale={xScale}
                                yScale={yScale}
                                zoom={zoom}
                                selectMode={selectMode}
                                selectable={selectable}
                                disableZoom={props.disableZoom}
                                groupPointsAnchor={props.groupPointsAnchor}
                                onDisplayedPointsChange={props.onDisplayedPointsChange}
                                onSelectionChange={props.onSelectionChange}
                                onPointClicked={props.onPointClicked}
                                leftAxisLabel={props.leftAxisLabel}
                                bottomAxisLabel={props.bottomAxisLabel}
                                miniMap={props.miniMap}
                                initialMiniMapOpen={initialState.minimap.open}
                                controlsHighlight={props.controlsHighlight}
                                disableTooltip={props.disableTooltip}
                                tooltipBody={props.tooltipBody}
                                border={props.border ?? false}
                                originLine={props.originLine}
                                backgroundGradient={props.backgroundGradient}
                                divRef={divRef}
                            />
                        </>
                    )
                }}
            </Zoom >
        </div>
    );
}

export default ScatterPlot;

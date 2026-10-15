import React, { useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { ChartProps, Point, ZoomType } from './types';
import { scaleLinear } from '@visx/scale';
import ControlButtons from './controls';
import { Stack, useTheme } from '@mui/material';
import { downloadDivAsPNG, downloadDivAsSVG } from '../../utility';
import { ResponsiveContainer, useResponsiveParentSize } from '../../responsive';
import { PlotTooltip, type PlotTooltipHandle } from '../../tooltip';
import { DEFAULT_DIM_STYLE, getDomains, getPointExtents, isSameTransform } from './helpers';
import ScatterPlotViewport from './ScatterPlotViewport';
import MiniMap from './minimap';
import PlotZoom from './PlotZoom';
import DefaultTooltipBody from './tooltip';
import { useSelectionMode } from './hooks/useSelectionMode';
import { useMiniMapToggle } from './hooks/useMiniMapToggle';
import { useHoverTooltip } from './hooks/useHoverTooltip';
import { useCrosshair } from './hooks/useCrosshair';
import { useHoveredPointKeys } from './hooks/useHoveredPointKeys';
import { getPlotLayout } from './layout';
import { useFieldRaster } from './hooks/useFieldRaster';

const ScatterPlot = <T extends object, S extends boolean | undefined = undefined, Z extends boolean | undefined = undefined>(
    props: ChartProps<T, S, Z>
) => {
    const theme = useTheme();
    const tooltipRef = useRef<PlotTooltipHandle<Point<T>>>(null);

    const initialSelectionMode = props.initialState?.controls?.selectionType ?? (props.selectable ? "select" : "pan");
    const initialMiniMapOpen = props.initialState?.minimap?.showWhileZoomed ?? false;

    const { parentRef, containerStyle, width: parentWidth, height: parentHeight } = useResponsiveParentSize({ width: props.width, height: props.height });
    const controlsPosition = props.controlsPosition ?? "left";
    const layout = getPlotLayout({
        parentWidth,
        parentHeight,
        square: props.square ?? false,
        controls: props.disableZoom ? null : controlsPosition,
        legend: Boolean(props.backgroundField?.legend),
    });
    const { margin, boundedWidth, boundedHeight } = layout;

    const divRef = React.useRef<HTMLDivElement>(null);
    const selectable = props.selectable ?? false;
    const downloadButton = props.downloadButton ?? false

    const { selectMode, handleSelectionModeChange } = useSelectionMode({ initialSelectionMode });

    const { showMiniMap, toggleMiniMap } = useMiniMapToggle({ initialOpen: initialMiniMapOpen });

    const pointExtents = useMemo(() => getPointExtents(props.pointData), [props.pointData]);
    const dataDomains = useMemo(() => getDomains(pointExtents), [pointExtents]);

    // Depend on the bounds rather than the arrays so a consumer passing a fresh domain array on
    // every render doesn't rebuild the scales (and with them every derived scale and canvas draw).
    const [xDomainMin, xDomainMax] = props.xDomain ?? dataDomains.xDomain;
    const [yDomainMin, yDomainMax] = props.yDomain ?? dataDomains.yDomain;

    const xScale = useMemo(() => {
        return scaleLinear({
            domain: [xDomainMin, xDomainMax],
            range: [0, boundedWidth],
        });
    }, [boundedWidth, xDomainMin, xDomainMax]);

    const yScale = useMemo(() => {
        return scaleLinear({
            domain: [yDomainMin, yDomainMax],
            range: [boundedHeight, 0],
        });
    }, [boundedHeight, yDomainMin, yDomainMax]);

    const { hoveredPoint, handleMouseMove, handleMouseLeave } = useHoverTooltip({
        pointData: props.pointData,
        margin,
        xScale,
        yScale,
        onHoveredPointChange: props.onHoveredPointChange,
        tooltipRef,
    });

    const hoveredPointKeys = useHoveredPointKeys({
        pointData: props.pointData,
        hoveredPoint,
        hoveredPoints: props.hoveredPoints,
        groupPointsAnchor: props.groupPointsAnchor,
    });
    // The cursor wins, as it does for hoveredPoints itself.
    const spotlit = (props.spotlight ?? false) && !hoveredPoint && props.hoveredPoints !== undefined;
    // Held by its fields, so a consumer passing a fresh object each render doesn't redraw every point.
    const dimColor = props.dimStyle?.color ?? DEFAULT_DIM_STYLE.color;
    const dimOpacity = props.dimStyle?.opacity ?? DEFAULT_DIM_STYLE.opacity;
    const dimStyle = useMemo(() => ({ color: dimColor, opacity: dimOpacity }), [dimColor, dimOpacity]);

    // Rasterized here rather than in the viewport, so the minimap draws the same bitmap.
    const fieldRaster = useFieldRaster(props.backgroundField);

    const crosshairEnabled = props.crosshair ?? false;

    const { crosshairPosition, handleCrosshairMove, handleCrosshairLeave } = useCrosshair({
        enabled: crosshairEnabled,
        margin,
        boundedWidth,
        boundedHeight,
        xScale,
        yScale,
        onCrosshairChange: props.onCrosshairChange,
    });

    // Our own pointer wins over an externally supplied position, so that leaving this plot for a
    // sibling hands the crosshair over rather than leaving both plots claiming it.
    const crosshair = crosshairEnabled ? crosshairPosition ?? props.crosshairPosition ?? null : null;

    const handlePointerMove = useCallback((event: React.MouseEvent<SVGElement>, zoom: ZoomType) => {
        handleMouseMove(event, zoom);
        handleCrosshairMove(event, zoom);
    }, [handleCrosshairMove, handleMouseMove]);

    const handlePointerLeave = useCallback(() => {
        handleMouseLeave();
        handleCrosshairLeave();
    }, [handleCrosshairLeave, handleMouseLeave]);

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

    const renderPlot = (zoom: ZoomType) => {
        // Anchor the buttons on the plot area explicitly - a shared zoom is sized by whoever owns
        // it, so visx's own default anchor (the centre of that size) isn't this plot's centre.
        const zoomCenter = { x: boundedWidth / 2, y: boundedHeight / 2 };
        const handleZoomIn = () => { zoom.scale({ scaleX: 1.2, scaleY: 1.2, point: zoomCenter }); }
        const handleZoomOut = () => { zoom.scale({ scaleX: 0.8, scaleY: 0.8, point: zoomCenter }); }
        const handleZoomReset = () => { zoom.reset(); }
        const zoomed = !isSameTransform(zoom.transformMatrix, zoom.initialTransformMatrix);

        return (
            <>
                {layout.controlsLeft !== null && (
                    <Stack
                        direction="column"
                        sx={{
                            position: 'absolute',
                            left: layout.controlsLeft,
                            top: margin.top,
                            zIndex: 10
                        }}
                    >
                        <ControlButtons
                            selectable={selectable}
                            resetable={zoomed}
                            handleSelectionModeChange={handleSelectionModeChange}
                            selectMode={selectMode}
                            zoomIn={handleZoomIn}
                            zoomOut={handleZoomOut}
                            zoomReset={handleZoomReset}
                            highlight={props.controlsHighlight}
                            downloadButton={downloadButton}
                            downloadPlot={handleDownload}
                            side={controlsPosition}
                            miniMap={props.disableMiniMap ? undefined : { open: showMiniMap, toggle: toggleMiniMap }}
                        />
                    </Stack>
                )}
                <ScatterPlotViewport
                    left={layout.left}
                    width={layout.width}
                    height={layout.height}
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
                    hoveredPoint={hoveredPoint}
                    hoveredPointKeys={hoveredPointKeys}
                    spotlit={spotlit}
                    dimStyle={dimStyle}
                    hoverGrowth={props.hoverGrowth}
                    hoverStroke={props.hoverStroke}
                    handleMouseMove={handlePointerMove}
                    handleMouseLeave={handlePointerLeave}
                    onDisplayedPointsChange={props.onDisplayedPointsChange}
                    onSelectionChange={props.onSelectionChange}
                    onPointClicked={props.onPointClicked}
                    leftAxisLabel={props.leftAxisLabel}
                    bottomAxisLabel={props.bottomAxisLabel}
                    border={props.border ?? false}
                    originLine={props.originLine}
                    backgroundField={props.backgroundField}
                    fieldRaster={fieldRaster}
                    crosshair={crosshair}
                    divRef={divRef}
                />
                {/* At the initial view the minimap would only repeat the plot, so it waits for a zoom or pan. */}
                {showMiniMap && zoomed && !props.disableMiniMap && !props.disableZoom && !props.loading && (
                    <MiniMap
                        boundedWidth={boundedWidth}
                        boundedHeight={boundedHeight}
                        plotLeft={layout.left + margin.left}
                        plotTop={margin.top}
                        pointData={props.pointData}
                        xScale={xScale}
                        yScale={yScale}
                        zoom={zoom}
                        crosshair={crosshair}
                        dimStyle={dimStyle}
                        spotlitKeys={spotlit ? hoveredPointKeys : null}
                        backgroundField={props.backgroundField}
                        fieldRaster={fieldRaster}
                    />
                )}
                {!props.disableTooltip && (
                    // Above the controls, which sit at z-index 10 in the root stacking context
                    // and would otherwise win against the portalled tooltip's auto z-index. The
                    // theme's tooltip layer also matches the MUI tooltips on those same controls.
                    <PlotTooltip ref={tooltipRef} zIndex={theme.zIndex.tooltip}>
                        {(point) =>
                            props.tooltipBody ? props.tooltipBody(point) : <DefaultTooltipBody point={point} />
                        }
                    </PlotTooltip>
                )}
            </>
        )
    };

    return (
        <ResponsiveContainer parentRef={parentRef} containerStyle={containerStyle}>
            {props.zoom
                ? renderPlot(props.zoom)
                : (
                    <PlotZoom width={boundedWidth} height={boundedHeight}>
                        {renderPlot}
                    </PlotZoom>
                )}
        </ResponsiveContainer>
    );
}

export default ScatterPlot;

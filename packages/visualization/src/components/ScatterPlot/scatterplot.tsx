import React, { useCallback, useImperativeHandle, useMemo } from 'react';
import { ChartProps, ZoomType } from './types';
import { Tooltip as VisxTooltip, TooltipProps, Portal, defaultStyles as visxTooltipStyles } from '@visx/tooltip';
import { scaleLinear } from '@visx/scale';
import ControlButtons from './controls';
import { IconButton, Stack, Tooltip, useTheme } from '@mui/material';
import { HighlightAlt } from '@mui/icons-material';
import { downloadDivAsPNG, downloadDivAsSVG } from '../../utility';
import { ResponsiveContainer, useResponsiveParentSize } from '../../responsive';
import { getDomains, getPointExtents, isSameTransform } from './helpers';
import ScatterPlotViewport from './ScatterPlotViewport';
import MiniMap from './minimap';
import PlotZoom from './PlotZoom';
import ScatterTooltip from './tooltip';
import { useSelectionMode } from './hooks/useSelectionMode';
import { useMiniMapToggle } from './hooks/useMiniMapToggle';
import { useHoverTooltip } from './hooks/useHoverTooltip';
import { useCrosshair } from './hooks/useCrosshair';

const MARGIN = { top: 20, right: 20, bottom: 70, left: 70 };

/**
 * The point tooltip is portalled to document.body, so it leaves the plot's stacking
 * context and cannot be layered against the plot's own overlays by DOM order alone.
 * visx ships no z-index of its own, which leaves it below the controls and the minimap
 * toggle (z-index 10) - those sit in the root stacking context, so they win against an
 * auto z-index no matter where the portal lands. Lifting the tooltip to the theme's
 * tooltip layer keeps it above them, and matches the MUI tooltips on the same controls.
 */
const useTooltipStyle = () => {
    const theme = useTheme();
    return useMemo(
        () => ({ ...visxTooltipStyles, zIndex: theme.zIndex.tooltip }),
        [theme.zIndex.tooltip]
    );
};

const ScatterPlot = <T extends object, S extends boolean | undefined = undefined, Z extends boolean | undefined = undefined>(
    props: ChartProps<T, S, Z>
) => {
    /**
 * Hacky workaround for complex type compatability issues. Hopefully this will fix itself when ugrading to React 19 - Jonathan 12/11/24
 * @todo remove this when possible
 */
    const VisTooltip = VisxTooltip as unknown as React.FC<TooltipProps>;

    const tooltipStyle = useTooltipStyle();

    const initialSelectionMode = props.initialState?.controls?.selectionType ?? (props.selectable ? "select" : "pan");
    const initialMiniMapOpen = props.initialState?.minimap?.open ?? false;

    const { parentRef, containerStyle, width: parentWidth, height: parentHeight } = useResponsiveParentSize({ width: props.width, height: props.height });
    const size = Math.min(parentHeight, parentWidth)

    const divRef = React.useRef<HTMLDivElement>(null);
    const selectable = props.selectable ?? false;
    const boundedWidth = size * 0.9 - MARGIN.left;
    const boundedHeight = boundedWidth;
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

    const { hoveredPoint, tooltipData, tooltipOpen, mouseX, mouseY, handleMouseMove, handleMouseLeave } =
        useHoverTooltip({ pointData: props.pointData, margin: MARGIN, xScale, yScale });

    const crosshairEnabled = props.crosshair ?? false;

    const { crosshairPosition, handleCrosshairMove, handleCrosshairLeave } = useCrosshair({
        enabled: crosshairEnabled,
        margin: MARGIN,
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

        const controlsPosition = props.controlsPosition ?? "left";

        return (
            <>
                {!props.disableZoom && (
                    <Stack
                        direction="column"
                        sx={{
                            position: 'absolute',
                            ...(controlsPosition === "right"
                                ? { right: `max(10px, calc(45% - ${size / 2}px))` }
                                : { left: `max(10px, calc(45% - ${size / 2}px))` }),
                            top: `calc(50% - ${size / 2}px + ${MARGIN.top}px)`,
                            zIndex: 10
                        }}
                    >
                        <ControlButtons
                            selectable={selectable}
                            resetable={!isSameTransform(zoom.transformMatrix, zoom.initialTransformMatrix)}
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
                    margin={MARGIN}
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
                    hoveredPoint={hoveredPoint}
                    handleMouseMove={handlePointerMove}
                    handleMouseLeave={handlePointerLeave}
                    onDisplayedPointsChange={props.onDisplayedPointsChange}
                    onSelectionChange={props.onSelectionChange}
                    onPointClicked={props.onPointClicked}
                    leftAxisLabel={props.leftAxisLabel}
                    bottomAxisLabel={props.bottomAxisLabel}
                    border={props.border ?? false}
                    originLine={props.originLine}
                    backgroundGradient={props.backgroundGradient}
                    crosshair={crosshair}
                    divRef={divRef}
                />
                {props.miniMap && !props.disableZoom && (
                    <Tooltip title="Toggle Minimap">
                        <IconButton
                            sx={{
                                position: "absolute",
                                right: 10,
                                bottom: 10,
                                zIndex: 10,
                                width: "auto",
                                height: "auto",
                                color: showMiniMap ? props.controlsHighlight ?? "primary.main" : "default",
                            }}
                            size="small"
                            onClick={toggleMiniMap}
                        >
                            <HighlightAlt />
                        </IconButton>
                    </Tooltip>
                )}
                {showMiniMap && props.miniMap && !props.disableZoom && !props.loading && (
                    <MiniMap
                        miniMap={props.miniMap}
                        width={size}
                        height={size}
                        pointData={props.pointData}
                        xScale={xScale}
                        yScale={yScale}
                        zoom={zoom}
                        crosshair={crosshair}
                    />
                )}
                {!props.disableTooltip && tooltipOpen && tooltipData && (
                    <Portal>
                        <VisTooltip left={mouseX + 10} top={mouseY} style={tooltipStyle}>
                            <ScatterTooltip tooltipBody={props.tooltipBody} tooltipData={tooltipData} />
                        </VisTooltip>
                    </Portal>
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

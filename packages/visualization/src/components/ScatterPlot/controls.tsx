import { useEffect } from "react";
import { ControlButtonsProps } from "./types";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { Add, Remove, BackHand, Edit, SettingsBackupRestore, Download, HighlightAlt } from "@mui/icons-material"
import { useTheme } from "@mui/material/styles";

/** MUI's small icon, which every button uses. */
const ICON_SIZE = 20;
const BUTTON_PADDING = 6;
const PANEL_BORDER = 1;

/** The panel's width, which getPlotLayout holds a lane of beside the plot. */
export const CONTROLS_WIDTH = ICON_SIZE + BUTTON_PADDING * 2 + PANEL_BORDER * 2;

const ControlButtons = ({
    selectable,
    resetable,
    handleSelectionModeChange,
    selectMode,
    zoomIn,
    zoomOut,
    zoomReset,
    highlight,
    downloadButton,
    downloadPlot,
    side,
    miniMap,
}: ControlButtonsProps) => {
    const theme = useTheme();
    const color = highlight ?? theme.palette.primary.main;
    // Towards the plot, rather than off the container's edge.
    const tooltipPlacement = side === "right" ? "left" : "right";

    const buttonSx = {
        borderRadius: 0,
        color: theme.palette.text.primary,
        padding: `${BUTTON_PADDING}px`,
    };

    useEffect(() => {
        // Function to handle key press
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift' && selectable && selectMode === "select") {
                handleSelectionModeChange('pan'); // Switch to pan mode when Shift is pressed

                // Function to handle key release
                const handleKeyUp = (e: KeyboardEvent) => {
                    if (e.key === 'Shift' && selectable) {
                        handleSelectionModeChange('select'); // Switch back to select mode when Shift is released
                    }
                };

                window.addEventListener('keyup', handleKeyUp);
                return () => {
                    window.removeEventListener('keyup', handleKeyUp);
                };
            }
        };

        // Add event listeners for key press and release
        window.addEventListener('keydown', handleKeyDown);

        // Clean up event listeners on unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleSelectionModeChange, selectMode, selectable]);

    const getToggleButtonSx = (active: boolean) => ({
        ...buttonSx,
        color: active ? highlight || "primary.main" : theme.palette.text.primary,
        backgroundColor: active
            ? `color-mix(in srgb, ${color} 15%, transparent)`
            : "transparent",
        '&:hover': {
            backgroundColor: active
                ? `color-mix(in srgb, ${color} 25%, transparent)`
                : theme.palette.action.hover,
        },
    });

    return (
        <>
            {selectMode !== "none" && (
                <Stack
                    direction="column"
                    alignItems="flex-start"
                    justifyContent={"center"}
                    sx={{
                        boxSizing: "border-box",
                        width: CONTROLS_WIDTH,
                        background: "rgba(255, 255, 255, 0.6)",
                        backdropFilter: "blur(2px)",
                        WebkitBackdropFilter: "blur(2px)",
                        border: `${PANEL_BORDER}px solid rgba(255, 255, 255, 0.3)`,
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        overflow: "hidden",
                    }}
                >
                    {
                        selectable && (
                            <Tooltip title="Drag to pan, or hold Shift and drag" placement={tooltipPlacement}>
                                <IconButton
                                    aria-label="pan"
                                    onClick={() => handleSelectionModeChange('pan')}
                                    sx={getToggleButtonSx(selectMode === "pan")}
                                >
                                    <BackHand fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )
                    }
                    {
                        selectable && (
                            <Tooltip title="Drag to select" placement={tooltipPlacement}>
                                <IconButton
                                    aria-label="edit"
                                    onClick={() => handleSelectionModeChange('select')}
                                    sx={getToggleButtonSx(selectMode === "select")}
                                >
                                    <Edit fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )
                    }
                    <Tooltip title="Zoom In" placement={tooltipPlacement}>
                        <IconButton aria-label="zoom-in" onClick={zoomIn} sx={buttonSx}>
                            <Add fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Zoom Out" placement={tooltipPlacement}>
                        <IconButton aria-label="zoom-out" onClick={zoomOut} sx={buttonSx}>
                            <Remove fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Zoom and Pan" placement={tooltipPlacement}>
                        {/* A disabled button fires no events, so the tooltip listens on a wrapper. Flex, so
                            the wrapper adds no line height around the button. */}
                        <span style={{ display: "flex" }}>
                            <IconButton aria-label="resetZoom" onClick={zoomReset} disabled={!resetable} sx={buttonSx}>
                                <SettingsBackupRestore fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    {miniMap && (
                        <Tooltip title={miniMap.open ? "Hide Minimap" : "Show Minimap While Zoomed"} placement={tooltipPlacement}>
                            <IconButton
                                aria-label="minimap"
                                aria-pressed={miniMap.open}
                                onClick={miniMap.toggle}
                                sx={getToggleButtonSx(miniMap.open)}
                            >
                                <HighlightAlt fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {downloadButton && (
                        <Tooltip title="Download Plot as SVG" placement={tooltipPlacement}>
                            <IconButton aria-label="download" onClick={() => downloadPlot()} sx={buttonSx}>
                                <Download fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            )}
        </>

    );
}

export default ControlButtons;

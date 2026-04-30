import { useEffect } from "react";
import { ControlButtonsProps } from "./types";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { Add, Remove, BackHand, Edit, SettingsBackupRestore, Download } from "@mui/icons-material"
import { useTheme } from "@mui/material/styles";

const ControlButtons = ({
    selectable,
    resetable,
    handleSelectionModeChange,
    selectMode,
    zoomIn,
    zoomOut,
    zoomReset,
    position,
    highlight,
    downloadButton,
    downloadPlot
}: ControlButtonsProps) => {

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

    const theme = useTheme();
    const color = highlight ?? theme.palette.primary.main;
    const direction = position === "bottom" ? "row" : "column";
    const tooltipPlacement = position === "right" ? "left" : position === "bottom" ? "top" : "right";
    const buttonSx = {
        borderRadius: 0,
        color: theme.palette.text.primary,
        padding: theme.spacing(1),
    };
    const getToggleButtonSx = (mode: "pan" | "select") => ({
        ...buttonSx,
        color: selectMode === mode ? highlight || "primary.main" : theme.palette.text.primary,
        backgroundColor: selectMode === mode
            ? `color-mix(in srgb, ${color} 15%, transparent)`
            : "transparent",
        '&:hover': {
            backgroundColor: selectMode === mode
                ? `color-mix(in srgb, ${color} 25%, transparent)`
                : theme.palette.action.hover,
        },
    });

    return (
        <>
            {selectMode !== "none" && (
                <Stack
                    direction={direction}
                    alignItems={position === "bottom" ? "center" : "flex-start"}
                    justifyContent={"center"}
                    sx={{
                        background: "rgba(255, 255, 255, 0.6)",
                        backdropFilter: "blur(2px)",
                        WebkitBackdropFilter: "blur(2px)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
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
                                    sx={getToggleButtonSx("pan")}
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
                                    sx={getToggleButtonSx("select")}
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
                        <IconButton aria-label="resetZoom" onClick={zoomReset} disabled={!resetable} sx={buttonSx}>
                            <SettingsBackupRestore fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {downloadButton === "inline" && (
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

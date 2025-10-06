import { useEffect } from "react";
import { ControlButtonsProps } from "./types";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { ZoomIn, ZoomOut, BackHand, Edit, SettingsBackupRestore, Download } from "@mui/icons-material"

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

    const toTransparent = (color: string, alpha = 0.15): string => {
        const temp = document.createElement("div");
        temp.style.color = color;
        document.body.appendChild(temp);

        // Let the browser resolve the color into RGB form
        const computed = getComputedStyle(temp).color;
        document.body.removeChild(temp);

        // computed should now be in "rgb(r, g, b)" or "rgba(r, g, b, a)" format
        const rgbMatch = computed.match(/\d+(\.\d+)?/g);
        if (!rgbMatch) return color;

        const [r, g, b] = rgbMatch.map(Number);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <>
            {selectMode !== "none" && (
                <Stack direction={position === "bottom" ? "row" : "column"} spacing={5} alignItems={"center"} justifyContent={"center"}>
                    {
                        selectable && (
                            <Tooltip title="Drag to pan, or hold Shift and drag">
                                <IconButton
                                    aria-label="pan" 
                                    onClick={() => handleSelectionModeChange('pan')} 
                                    sx={{
                                        color: selectMode === "pan" ? highlight || "primary.main" : "default",
                                        backgroundColor: selectMode === "pan"
                                            ? theme => toTransparent(highlight || theme.palette.primary.main, 0.15)
                                            : "transparent",
                                        '&:hover': {
                                            backgroundColor: selectMode === "pan"
                                                ? theme => toTransparent(highlight || theme.palette.primary.main, 0.25)
                                                : theme => theme.palette.action.hover,
                                        },
                                    }}
                                >
                                    <BackHand />
                                </IconButton>
                            </Tooltip>
                        )
                    }
                    {
                        selectable && (
                            <Tooltip title="Drag to select">
                                <IconButton 
                                    aria-label="edit" 
                                    onClick={() => handleSelectionModeChange('select')}
                                    sx={{
                                        color: selectMode === "select" ? highlight || "primary.main" : "default",
                                        backgroundColor: selectMode === "select"
                                            ? theme => toTransparent(highlight || theme.palette.primary.main, 0.15)
                                            : "transparent",
                                        '&:hover': {
                                            backgroundColor: selectMode === "select"
                                                ? theme => toTransparent(highlight || theme.palette.primary.main, 0.25)
                                                : theme => theme.palette.action.hover,
                                        },
                                    }}
                                >
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                        )
                    }
                    <Tooltip title="Zoom In">
                        <IconButton aria-label="zoom-in" onClick={zoomIn}>
                            <ZoomIn />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Zoom Out">
                        <IconButton aria-label="zoom-out" onClick={zoomOut}>
                            <ZoomOut />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Zoom and Pan">
                        <IconButton aria-label="resetZoom" onClick={zoomReset} disabled={!resetable}>
                            <SettingsBackupRestore />
                        </IconButton>
                    </Tooltip>
                    {downloadButton === "inline" && (
                        <Tooltip title="Download Plot as PNG">
                            <IconButton aria-label="download" onClick={() => downloadPlot()}>
                                <Download />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            )}
        </>

    );
}

export default ControlButtons;